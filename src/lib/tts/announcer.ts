import type { CourtCase } from "@/data/cases"

import {
  buildAnnouncement,
  TASHKEEL,
  testAnnouncement,
  type AnnouncementLanguage,
  type CallMode,
  type SpeechSegment,
} from "./announcement"
import { readModelFile, readModelJson } from "./model-files"
import type { ModelName, SupertonicConfig, SupertonicTTS, VoiceStyle, VoiceStyleJson } from "./supertonic"

/*
 * Plays court announcements with Supertonic 3, running in the browser on this
 * device (WebGPU when available, otherwise WebAssembly). Nothing is sent to a
 * speech service; only the model files are downloaded, once.
 */

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
  lang: AnnouncementLanguage
  /** Whether a call reads the case number, the parties, or both. */
  mode: CallMode
  voice: Voice
  /** Speaking rate; 1 is the model's natural pace. */
  speed: number
  steps: number
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = { lang: "ar", mode: "both", voice: "M1", speed: 1.05, steps: 8 }
export const SPEED_RANGE = { min: 0.8, max: 1.5, step: 0.05 }

export type AnnouncerStatus =
  | { state: "idle" }
  | { state: "loading"; file: number; files: number; fraction: number }
  | { state: "ready"; backend: Backend }
  | { state: "speaking"; backend: Backend }
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
      lang: s.lang === "en" ? "en" : "ar",
      mode: s.mode === "number" || s.mode === "parties" ? s.mode : "both",
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

// ---------------------------------------------------------------------------
// Model loading

interface Engine {
  ort: typeof import("onnxruntime-web")
  tts: SupertonicTTS
  backend: Backend
}

let engine: Promise<Engine> | null = null
const voiceStyles = new Map<Voice, Promise<VoiceStyle>>()

/** Starts loading the model in the background. Safe to call repeatedly. */
export function preloadAnnouncer() {
  if (!engine) {
    engine = loadEngine()
    engine.catch((error: unknown) => {
      engine = null
      update({ status: { state: "error", message: errorMessage(error) } })
    })
  }
  return engine
}

function errorMessage(error: unknown) {
  // fetch() rejects with a TypeError when the server can't be reached or blocks the request.
  if (error instanceof TypeError) return "تعذّر الاتصال بمصدر ملفات النموذج"
  return error instanceof Error ? error.message : String(error)
}

async function loadEngine(): Promise<Engine> {
  const { MODEL_NAMES, createSupertonic } = await import("./supertonic")
  const files = MODEL_NAMES.length
  update({ status: { state: "loading", file: 1, files, fraction: 0 } })

  // Loaded only when announcements are used, so the audience board stays light.
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
  update({ status: { state: "ready", backend } })
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

/**
 * Must run inside the click that triggers an announcement: browsers only allow
 * sound that starts from a user action, and synthesis finishes after the click.
 */
function unlockAudio() {
  audioContext ??= new AudioContext()
  if (audioContext.state === "suspended") void audioContext.resume()
  return audioContext
}

function stopPlayback() {
  requestId++
  currentSource?.stop()
  currentSource = null
}

/** Speaks the segments with the current settings, replacing anything already playing. */
function speak(segments: SpeechSegment[]) {
  const ctx = unlockAudio()
  stopPlayback()
  const id = requestId
  const settings = snapshot.settings

  preloadAnnouncer()
    .then(async (loaded) => {
      if (id !== requestId) return
      update({ status: { state: "speaking", backend: loaded.backend } })
      const style = await loadVoiceStyle(loaded, settings.voice)
      // Use tashkeel only if the model was trained with it; otherwise read the bare letters.
      const spoken = loaded.tts.supports("\u064E") ? segments : segments.map((s) => ({ ...s, text: s.text.replace(TASHKEEL, "") }))
      const pcm = await loaded.tts.synthesize(spoken, style, { totalStep: settings.steps, speed: settings.speed })
      if (id !== requestId) return
      const buffer = ctx.createBuffer(1, pcm.length, loaded.tts.sampleRate)
      buffer.copyToChannel(pcm, 0)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.onended = () => {
        if (currentSource === source) {
          currentSource = null
          update({ status: { state: "ready", backend: loaded.backend } })
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

/** Announces the case now being heard, if announcements are on. */
export function announceCase(courtCase: CourtCase) {
  if (snapshot.enabled) speak(buildAnnouncement(courtCase, snapshot.settings.lang, snapshot.settings.mode))
}

/** Plays a short test sentence with the current settings. */
export function announceTest() {
  speak(testAnnouncement(snapshot.settings.lang))
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
    void preloadAnnouncer()
  }
}
