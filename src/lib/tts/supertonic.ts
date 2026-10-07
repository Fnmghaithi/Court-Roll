/*
 * Browser inference for Supertonic 3 text-to-speech, ported from Supertone's
 * web example (https://github.com/supertone-inc/supertonic, web/helper.js,
 * MIT License, Copyright (c) 2025 Supertone Inc.). The model weights are
 * released separately under the OpenRAIL-M license.
 *
 * Kept close to the reference so its behaviour matches the published demo;
 * the main change is using flat typed arrays instead of nested JS arrays.
 */
import type * as Ort from "onnxruntime-web"

type OrtModule = typeof Ort

export interface SupertonicConfig {
  ae: { sample_rate: number; base_chunk_size: number }
  ttl: { chunk_compress_factor: number; latent_dim: number }
}

interface Style {
  ttl: Ort.Tensor
  dp: Ort.Tensor
}

interface VoiceStyleJson {
  style_ttl: { dims: number[]; data: unknown[] }
  style_dp: { dims: number[]; data: unknown[] }
}

const AVAILABLE_LANGS = new Set([
  "en", "ko", "ja", "ar", "bg", "cs", "da", "de", "el", "es", "et", "fi", "fr", "hi", "hr", "hu",
  "id", "it", "lt", "lv", "nl", "pl", "pt", "ro", "ru", "sk", "sl", "sv", "tr", "uk", "vi", "na",
])

function preprocessText(text: string, lang: string) {
  text = text.normalize("NFKD")

  text = text.replace(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]+/gu,
    ""
  )

  const replacements: Record<string, string> = {
    "–": "-", "‑": "-", "—": "-", _: " ",
    "“": '"', "”": '"', "‘": "'", "’": "'", "´": "'", "`": "'",
    "[": " ", "]": " ", "|": " ", "/": " ", "#": " ", "→": " ", "←": " ",
  }
  for (const [k, v] of Object.entries(replacements)) text = text.replaceAll(k, v)

  text = text.replace(/[♥☆♡©\\]/g, "")

  const exprReplacements: Record<string, string> = { "@": " at ", "e.g.,": "for example, ", "i.e.,": "that is, " }
  for (const [k, v] of Object.entries(exprReplacements)) text = text.replaceAll(k, v)

  text = text
    .replace(/ ,/g, ",")
    .replace(/ \./g, ".")
    .replace(/ !/g, "!")
    .replace(/ \?/g, "?")
    .replace(/ ;/g, ";")
    .replace(/ :/g, ":")
    .replace(/ '/g, "'")

  while (text.includes('""')) text = text.replace('""', '"')
  while (text.includes("''")) text = text.replace("''", "'")
  while (text.includes("``")) text = text.replace("``", "`")

  text = text.replace(/\s+/g, " ").trim()

  if (!/[.!?;:,'"')\]}…。」』】〉》›»]$/.test(text)) text += "."

  if (!AVAILABLE_LANGS.has(lang)) throw new Error(`Invalid language: ${lang}`)

  return `<${lang}>${text}</${lang}>`
}

/** Splits long text into chunks the model handles well, on sentence boundaries. */
function chunkText(text: string, maxLen = 300) {
  const chunks: string[] = []
  for (const raw of text.trim().split(/\n\s*\n+/)) {
    const paragraph = raw.trim()
    if (!paragraph) continue
    const sentences = paragraph.split(
      /(?<!Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.|Sr\.|Jr\.|Ph\.D\.|etc\.|e\.g\.|i\.e\.|vs\.|Inc\.|Ltd\.|Co\.|Corp\.|St\.|Ave\.|Blvd\.)(?<!\b[A-Z]\.)(?<=[.!?])\s+/
    )
    let current = ""
    for (const sentence of sentences) {
      if (current.length + sentence.length + 1 <= maxLen) {
        current += (current ? " " : "") + sentence
      } else {
        if (current) chunks.push(current.trim())
        current = sentence
      }
    }
    if (current) chunks.push(current.trim())
  }
  return chunks
}

/** Standard normal sample (Box-Muller), as in the reference. */
function randn() {
  const u1 = Math.max(0.0001, Math.random())
  const u2 = Math.random()
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
}

interface Sessions {
  dp: Ort.InferenceSession
  textEnc: Ort.InferenceSession
  vectorEst: Ort.InferenceSession
  vocoder: Ort.InferenceSession
}

export class SupertonicTTS {
  readonly sampleRate: number
  private ort: OrtModule
  private cfgs: SupertonicConfig
  private indexer: number[]
  private dp: Ort.InferenceSession
  private textEnc: Ort.InferenceSession
  private vectorEst: Ort.InferenceSession
  private vocoder: Ort.InferenceSession

  constructor(ort: OrtModule, cfgs: SupertonicConfig, indexer: number[], sessions: Sessions) {
    this.ort = ort
    this.cfgs = cfgs
    this.indexer = indexer
    this.dp = sessions.dp
    this.textEnc = sessions.textEnc
    this.vectorEst = sessions.vectorEst
    this.vocoder = sessions.vocoder
    this.sampleRate = cfgs.ae.sample_rate
  }

  /** Synthesises one chunk of text. Returns mono PCM samples at `sampleRate`. */
  private async infer(text: string, lang: string, style: Style, totalStep: number, speed: number) {
    const { ort } = this
    const processed = preprocessText(text, lang)

    // Text ids per code point, as the reference does with codePointAt on UTF-16 indices.
    const len = processed.length
    const ids = new BigInt64Array(len)
    for (let j = 0; j < len; j++) {
      const cp = processed.codePointAt(j)!
      ids[j] = BigInt(cp < this.indexer.length ? this.indexer[cp] : -1)
    }
    const textIds = new ort.Tensor("int64", ids, [1, len])
    const textMask = new ort.Tensor("float32", new Float32Array(len).fill(1), [1, 1, len])

    const dpOut = await this.dp.run({ text_ids: textIds, style_dp: style.dp, text_mask: textMask })
    const duration = (dpOut.duration.data as Float32Array)[0] / speed

    const encOut = await this.textEnc.run({ text_ids: textIds, style_ttl: style.ttl, text_mask: textMask })
    const textEmb = encOut.text_emb

    // Noisy latent sized to the predicted duration.
    const chunkSize = this.cfgs.ae.base_chunk_size * this.cfgs.ttl.chunk_compress_factor
    const wavLen = Math.floor(duration * this.sampleRate)
    const latentLen = Math.floor((wavLen + chunkSize - 1) / chunkSize)
    const latentDim = this.cfgs.ttl.latent_dim * this.cfgs.ttl.chunk_compress_factor
    let xt = new Float32Array(latentDim * latentLen)
    for (let i = 0; i < xt.length; i++) xt[i] = randn()
    const latentMask = new ort.Tensor("float32", new Float32Array(latentLen).fill(1), [1, 1, latentLen])

    const totalStepTensor = new ort.Tensor("float32", new Float32Array([totalStep]), [1])
    for (let step = 0; step < totalStep; step++) {
      const out = await this.vectorEst.run({
        noisy_latent: new ort.Tensor("float32", xt, [1, latentDim, latentLen]),
        text_emb: textEmb,
        style_ttl: style.ttl,
        latent_mask: latentMask,
        text_mask: textMask,
        current_step: new ort.Tensor("float32", new Float32Array([step]), [1]),
        total_step: totalStepTensor,
      })
      xt = Float32Array.from(out.denoised_latent.data as Float32Array)
    }

    const vocOut = await this.vocoder.run({ latent: new ort.Tensor("float32", xt, [1, latentDim, latentLen]) })
    // The vocoder pads to whole latent chunks; trim to the predicted length as the reference does.
    return (vocOut.wav_tts.data as Float32Array).subarray(0, wavLen)
  }

  /**
   * Synthesises a sequence of text segments, each in its own language, joining
   * them (and the chunks of long segments) with short pauses.
   */
  async synthesize(
    segments: { text: string; lang: string }[],
    style: Style,
    { totalStep = 8, speed = 1.05, silence = 0.3 } = {}
  ) {
    const parts: Float32Array[] = []
    const gap = new Float32Array(Math.floor(silence * this.sampleRate))
    for (const { text, lang } of segments) {
      const maxLen = lang === "ko" || lang === "ja" ? 120 : 300
      for (const chunk of chunkText(text, maxLen)) {
        if (parts.length) parts.push(gap)
        parts.push(await this.infer(chunk, lang, style, totalStep, speed))
      }
    }
    const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0))
    let offset = 0
    for (const p of parts) {
      out.set(p, offset)
      offset += p.length
    }
    return out
  }
}

export type VoiceStyle = Style

/** Builds a voice style tensor pair from one of the `voice_styles/*.json` files. */
export function parseVoiceStyle(ort: OrtModule, json: VoiceStyleJson): VoiceStyle {
  const ttl = Float32Array.from(json.style_ttl.data.flat(Infinity) as number[])
  const dp = Float32Array.from(json.style_dp.data.flat(Infinity) as number[])
  return {
    ttl: new ort.Tensor("float32", ttl, [1, json.style_ttl.dims[1], json.style_ttl.dims[2]]),
    dp: new ort.Tensor("float32", dp, [1, json.style_dp.dims[1], json.style_dp.dims[2]]),
  }
}

export type { VoiceStyleJson }

export const MODEL_NAMES = ["duration_predictor", "text_encoder", "vector_estimator", "vocoder"] as const
export type ModelName = (typeof MODEL_NAMES)[number]

/** Creates the four inference sessions from downloaded model bytes. */
export async function createSupertonic(
  ort: OrtModule,
  cfgs: SupertonicConfig,
  indexer: number[],
  models: Record<ModelName, Uint8Array>,
  options: Ort.InferenceSession.SessionOptions
) {
  // One at a time, as in the reference, to keep peak memory down.
  const sessions: Ort.InferenceSession[] = []
  for (const name of MODEL_NAMES) sessions.push(await ort.InferenceSession.create(models[name], options))
  const [dp, textEnc, vectorEst, vocoder] = sessions
  return new SupertonicTTS(ort, cfgs, indexer, { dp, textEnc, vectorEst, vocoder })
}
