import {
  buildAnnouncement,
  classicAnnouncement,
  TASHKEEL,
  testAnnouncement,
  type AnnouncedCase,
  type AnnouncementLanguage,
  type CallMode,
  type SpeechSegment,
  type Wording,
} from "./announcement"
import { TTS_ENGINE } from "./config"
import { readModelFile, readModelJson } from "./model-files"
import type { ModelName, SupertonicConfig, SupertonicTTS, VoiceStyle, VoiceStyleJson } from "./supertonic"
import { loadWebSpeechVoice, speakWebSpeech, stopWebSpeech } from "./webspeech"

/*
 * Announces cases on the hearing schedule with the engine chosen in config.ts:
 * the browser's voice (Microsoft Naayf), or Supertonic 3 running on this
 * device. Both follow the same wording settings.
 */

export { TTS_ENGINE }

export type Backend = "webgpu" | "wasm"

export const VOICES = ["M1", "M2", "M3", "M4", "M5", "F1", "F2", "F3", "F4", "F5"] as const
export type Voice = (typeof VOICES)[number]

/** Denoising steps: more is clearer but slower. */
export const QUALITY_PRESETS = [
  { steps: 4, label: "سريع" },
  { steps: 8, label: "متوازن" },
  { steps: 16, label: "أعلى جودة" },
] as const

export interface VoiceSettings {
  /** The original sentence with tafqit.min.js, or the vowelled wording. */
  wording: Wording
  /** Vowelled wording: whether a call reads the case number, the parties, or both. */
  mode: CallMode
  /** Supertonic, vowelled wording: Arabic, or English around the Arabic names. */
  lang: AnnouncementLanguage
  /** Supertonic voice. */
  voice: Voice
  /** Supertonic speaking rate; 1 is the model's natural pace. */
  speed: number
  /** Supertonic quality (denoising steps). */
  steps: number
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  wording: "classic",
  mode: "both",
  lang: "ar",
  voice: "M1",
  speed: 1.05,
  steps: 8,
}
export const SPEED_RANGE = { min: 0.8, max: 1.5, step: 0.05 }

export type AnnouncerStatus =
  | { state: "idle" }
  | { state: "loading"; file: number; files: number; fraction: number }
  | { state: "ready"; detail: string }
  | { state: "speaking"; detail: string }
  /** The browser refused to play sound until someone interacts with the page. */
  | { state: "blocked" }
  | { state: "error"; message: string }

interface AnnouncerSnapshot {
  enabled: boolean
  settings: VoiceSettings
  status: AnnouncerStatus
}

const ENABLED_KEY = "court-roll:announcements"
const SETTINGS_KEY = "court-roll:voice-settings"

function readStored<T>(key: string, fallback: T, parse: (raw: string) => T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : parse(raw)
  } catch {
    return fallback
  }
}

function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Not remembered across reloads without storage.
  }
}

function readSettings(): VoiceSettings {
  return readStored(SETTINGS_KEY, DEFAULT_VOICE_SETTINGS, (raw) => {
    const s = { ...DEFAULT_VOICE_SETTINGS, ...(JSON.parse(raw) as Partial<VoiceSettings>) }
    return {
      wording: s.wording === "tashkeel" ? "tashkeel" : "classic",
      mode: s.mode === "number" || s.mode === "parties" ? s.mode : "both",
      lang: s.lang === "en" ? "en" : "ar",
      voice: VOICES.includes(s.voice) ? s.voice : DEFAULT_VOICE_SETTINGS.voice,
      speed: Math.min(SPEED_RANGE.max, Math.max(SPEED_RANGE.min, Number(s.speed) || DEFAULT_VOICE_SETTINGS.speed)),
      steps: QUALITY_PRESETS.some((q) => q.steps === s.steps) ? s.steps : DEFAULT_VOICE_SETTINGS.steps,
    }
  })
}

let snapshot: AnnouncerSnapshot = {
  enabled: readStored(ENABLED_KEY, true, (raw) => raw !== "off"),
  settings: readSettings(),
  status: { state: "idle" },
}
const listeners = new Set<() => void>()

function update(next: Partial<AnnouncerSnapshot>) {
  snapshot = { ...snapshot, ...next }
  listeners.forEach((l) => l())
}

export function subscribeAnnouncer(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getAnnouncerSnapshot() {
  return snapshot
}

function errorMessage(error: unknown) {
  // fetch() rejects with a TypeError when the server can't be reached or blocks the request.
  if (error instanceof TypeError) return "تعذّر الاتصال بمصدر ملفات النموذج"
  return error instanceof Error ? error.message : String(error)
}

// ---------------------------------------------------------------------------
// Browser voice

let webSpeechReady: Promise<string> | null = null

function prepareWebSpeech() {
  webSpeechReady ??= loadWebSpeechVoice().then(
    (voice) => {
      const detail = voice ? voice.name : "صوت المتصفح"
      if (snapshot.status.state === "idle") update({ status: { state: "ready", detail } })
      return detail
    },
    (error: unknown) => {
      webSpeechReady = null
      update({ status: { state: "error", message: errorMessage(error) } })
      throw error
    }
  )
  return webSpeechReady
}

// ---------------------------------------------------------------------------
// Supertonic model loading

interface Engine {
  ort: typeof import("onnxruntime-web")
  tts: SupertonicTTS
  backend: Backend
}

let engine: Promise<Engine> | null = null
const voiceStyles = new Map<Voice, Promise<VoiceStyle>>()

const backendLabel = (backend: Backend) =>
  backend === "webgpu" ? "Supertonic · بطاقة الرسوميات" : "Supertonic · المعالج"

function prepareSupertonic() {
  if (!engine) {
    engine = loadEngine()
    engine.catch((error: unknown) => {
      engine = null
      update({ status: { state: "error", message: errorMessage(error) } })
    })
  }
  return engine
}

/** Prepares the configured engine (downloads Supertonic, or finds the browser voice). Safe to call repeatedly. */
export function preloadAnnouncer() {
  if (TTS_ENGINE === "webspeech") prepareWebSpeech().catch(() => {})
  else prepareSupertonic().catch(() => {})
}

async function loadEngine(): Promise<Engine> {
  const { MODEL_NAMES, createSupertonic } = await import("./supertonic")
  const files = MODEL_NAMES.length
  update({ status: { state: "loading", file: 1, files, fraction: 0 } })

  // Loaded only when Supertonic is used, so the board stays light otherwise.
  const ort = await import("onnxruntime-web/webgpu")
  const cfgs = await readModelJson<SupertonicConfig>("onnx/tts.json")
  const indexer = await readModelJson<number[]>("onnx/unicode_indexer.json")

  const models = {} as Record<ModelName, Uint8Array>
  for (const [i, name] of MODEL_NAMES.entries()) {
    models[name] = await readModelFile(`onnx/${name}.onnx`, (fraction) =>
      update({ status: { state: "loading", file: i + 1, files, fraction } })
    )
  }

  let backend: Backend = "webgpu"
  let tts: SupertonicTTS
  try {
    if (!("gpu" in navigator)) throw new Error("WebGPU unavailable")
    tts = await createSupertonic(ort, cfgs, indexer, models, { executionProviders: ["webgpu"], graphOptimizationLevel: "all" })
  } catch {
    backend = "wasm"
    tts = await createSupertonic(ort, cfgs, indexer, models, { executionProviders: ["wasm"], graphOptimizationLevel: "all" })
  }

  const loaded = { ort, tts, backend }
  await loadVoiceStyle(loaded, snapshot.settings.voice)
  update({ status: { state: "ready", detail: backendLabel(backend) } })
  return loaded
}

function loadVoiceStyle({ ort }: Engine, voice: Voice) {
  let style = voiceStyles.get(voice)
  if (!style) {
    style = import("./supertonic").then(async ({ parseVoiceStyle }) =>
      parseVoiceStyle(ort, await readModelJson<VoiceStyleJson>(`voice_styles/${voice}.json`))
    )
    style.catch(() => voiceStyles.delete(voice))
    voiceStyles.set(voice, style)
  }
  return style
}

// ---------------------------------------------------------------------------
// Playback

let audioContext: AudioContext | null = null
let currentSource: AudioBufferSourceNode | null = null
let requestId = 0
let lastSegments: SpeechSegment[] | null = null

function getAudioContext() {
  audioContext ??= new AudioContext()
  if (audioContext.state === "suspended") void audioContext.resume()
  return audioContext
}

function stopPlayback({ speech = true } = {}) {
  requestId++
  currentSource?.stop()
  currentSource = null
  if (speech) stopWebSpeech()
}

/** Speaks the segments with the current settings, replacing anything already playing. */
function speak(segments: SpeechSegment[]) {
  lastSegments = segments
  // The browser voice stops the previous sentence itself, pausing briefly to avoid a Chrome bug.
  stopPlayback({ speech: TTS_ENGINE !== "webspeech" })
  const id = requestId

  if (TTS_ENGINE === "webspeech") {
    const text = segments.map((s) => s.text).join(" ")
    prepareWebSpeech()
      .then((detail) => {
        if (id !== requestId) return
        update({ status: { state: "speaking", detail } })
        speakWebSpeech(text, {
          onEnd: () => id === requestId && update({ status: { state: "ready", detail } }),
          onError: (error) => {
            if (id !== requestId) return
            update({
              status: error === "not-allowed" ? { state: "blocked" } : { state: "error", message: `خطأ في النطق: ${error}` },
            })
          },
        })
      })
      .catch(() => {})
    return
  }

  const ctx = getAudioContext()
  const settings = snapshot.settings
  prepareSupertonic()
    .then(async (loaded) => {
      if (id !== requestId) return
      const detail = backendLabel(loaded.backend)
      update({ status: { state: "speaking", detail } })
      const style = await loadVoiceStyle(loaded, settings.voice)
      // Use tashkeel only if the model was trained with it; otherwise read the bare letters.
      const spoken = loaded.tts.supports("َ")
        ? segments
        : segments.map((s) => ({ ...s, text: s.text.replace(TASHKEEL, "") }))
      const pcm = await loaded.tts.synthesize(spoken, style, { totalStep: settings.steps, speed: settings.speed })
      if (id !== requestId) return
      if (ctx.state !== "running") {
        update({ status: { state: "blocked" } })
        return
      }
      const buffer = ctx.createBuffer(1, pcm.length, loaded.tts.sampleRate)
      buffer.copyToChannel(pcm, 0)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.onended = () => {
        if (currentSource === source) {
          currentSource = null
          update({ status: { state: "ready", detail } })
        }
      }
      currentSource = source
      source.start()
    })
    .catch((error: unknown) => {
      if (id !== requestId) return
      update({ status: { state: "error", message: errorMessage(error) } })
    })
}

/** The segments to speak for a case, following the wording settings. */
export function announcementFor(courtCase: AnnouncedCase, settings = snapshot.settings): SpeechSegment[] {
  if (settings.wording === "classic") return [{ lang: "ar", text: classicAnnouncement(courtCase.caseNumber) }]
  // The browser voice is Arabic only, so English applies to Supertonic.
  const lang = TTS_ENGINE === "supertonic" ? settings.lang : "ar"
  return buildAnnouncement(courtCase, lang, settings.mode)
}

/** Announces a case now being heard, if announcements are on. */
export function announceCase(courtCase: AnnouncedCase) {
  if (snapshot.enabled) speak(announcementFor(courtCase))
}

/** Plays a short test sentence with the current settings. */
export function announceTest() {
  speak(testAnnouncement(TTS_ENGINE === "supertonic" ? snapshot.settings.lang : "ar"))
}

/**
 * For a click after the browser blocked sound: unlocks audio and replays the
 * announcement that was blocked.
 */
export function unlockAndReplay() {
  if (TTS_ENGINE === "supertonic") getAudioContext()
  update({ status: { state: "idle" } })
  if (lastSegments) speak(lastSegments)
  else preloadAnnouncer()
}

export function setAnnouncementsEnabled(enabled: boolean) {
  store(ENABLED_KEY, enabled ? "on" : "off")
  if (!enabled) stopPlayback()
  update({ enabled })
}

export function updateVoiceSettings(next: Partial<VoiceSettings>) {
  const settings = { ...snapshot.settings, ...next }
  store(SETTINGS_KEY, JSON.stringify(settings))
  update({ settings })
}

/** Clears a failed load so the next announcement tries again. */
export function retryAnnouncer() {
  if (snapshot.status.state === "error") {
    update({ status: { state: "idle" } })
    preloadAnnouncer()
  }
}
