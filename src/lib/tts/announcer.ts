import type { loadVoiceStyle, SupertonicTTS } from "./supertonic"

type VoiceStyle = Awaited<ReturnType<typeof loadVoiceStyle>>
type Backend = "webgpu" | "wasm"

interface Engine {
  tts: SupertonicTTS
  style: VoiceStyle
  backend: Backend
}

/*
 * Loads Supertonic 3 once, on demand, and plays announcements in the browser.
 * The model runs on this device (WebGPU when available, otherwise WebAssembly);
 * only the model files are downloaded, the first time.
 *
 * Model files default to the archived Supertonic 3 snapshot on Hugging Face.
 * To self-host them (recommended for the court network), download that snapshot
 * and set VITE_SUPERTONIC_URL to the folder holding `onnx/` and `voice_styles/`.
 */
const MODEL_URL =
  import.meta.env.VITE_SUPERTONIC_URL ??
  "https://huggingface.co/supertone-oss-archive/supertonic-3/resolve/aafc6e32416a594460b32413efc49d7fe4ce6d46"
const VOICE = import.meta.env.VITE_SUPERTONIC_VOICE ?? "M1"
const LANG = "ar"
const ENABLED_KEY = "court-roll:announcements"

export type AnnouncerStatus =
  | { state: "idle" }
  | { state: "loading"; loaded: number; total: number }
  | { state: "ready"; backend: Backend }
  | { state: "speaking"; backend: Backend }
  | { state: "error"; message: string }

interface AnnouncerSnapshot {
  enabled: boolean
  status: AnnouncerStatus
}

function readEnabled() {
  try {
    return localStorage.getItem(ENABLED_KEY) !== "off"
  } catch {
    return true
  }
}

let snapshot: AnnouncerSnapshot = { enabled: readEnabled(), status: { state: "idle" } }
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

let engine: Promise<Engine> | null = null

/** Starts loading the model in the background. Safe to call repeatedly. */
export function preloadAnnouncer() {
  if (!engine) {
    engine = loadEngine().catch((error: unknown) => {
      engine = null
      const message = error instanceof Error ? error.message : String(error)
      update({ status: { state: "error", message } })
      throw error
    })
    engine.catch(() => {})
  }
  return engine
}

async function loadEngine(): Promise<Engine> {
  update({ status: { state: "loading", loaded: 0, total: 4 } })
  // Loaded only when announcements are used, so the audience board stays light.
  const ort = await import("onnxruntime-web/webgpu")
  const { loadSupertonic, loadVoiceStyle } = await import("./supertonic")
  const onProgress = (loaded: number, total: number) =>
    update({ status: { state: "loading", loaded, total } })
  const onnxDir = `${MODEL_URL}/onnx`

  let backend: Backend = "webgpu"
  let tts: SupertonicTTS
  try {
    if (!("gpu" in navigator)) throw new Error("WebGPU unavailable")
    tts = await loadSupertonic(ort, onnxDir, { executionProviders: ["webgpu"], graphOptimizationLevel: "all" }, onProgress)
  } catch {
    backend = "wasm"
    tts = await loadSupertonic(ort, onnxDir, { executionProviders: ["wasm"], graphOptimizationLevel: "all" }, onProgress)
  }
  const style = await loadVoiceStyle(ort, `${MODEL_URL}/voice_styles/${VOICE}.json`)
  update({ status: { state: "ready", backend } })
  return { tts, style, backend }
}

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

/** Speaks `text` in Arabic, replacing anything already playing. */
export function announce(text: string) {
  if (!snapshot.enabled) return
  const ctx = unlockAudio()
  const id = ++requestId
  currentSource?.stop()

  preloadAnnouncer()
    .then(async ({ tts, style, backend }) => {
      if (id !== requestId) return
      update({ status: { state: "speaking", backend } })
      const pcm = await tts.synthesize(text, LANG, style)
      if (id !== requestId) return
      const buffer = ctx.createBuffer(1, pcm.length, tts.sampleRate)
      buffer.copyToChannel(pcm, 0)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.onended = () => {
        if (currentSource === source) {
          currentSource = null
          update({ status: { state: "ready", backend } })
        }
      }
      currentSource = source
      source.start()
    })
    .catch((error: unknown) => {
      if (id !== requestId) return
      const message = error instanceof Error ? error.message : String(error)
      update({ status: { state: "error", message } })
    })
}

export function setAnnouncementsEnabled(enabled: boolean) {
  try {
    localStorage.setItem(ENABLED_KEY, enabled ? "on" : "off")
  } catch {
    // Not remembered across reloads without storage.
  }
  if (!enabled) {
    requestId++
    currentSource?.stop()
    currentSource = null
  }
  update({ enabled })
}
