import { WEB_SPEECH } from "./config"

/*
 * The browser's built-in speech (Web Speech API), as used by the original
 * hearing schedule: Microsoft Naayf when available, rate 2.2, pitch 0.5.
 */

let voice: SpeechSynthesisVoice | null = null

function pickVoice() {
  const voices = speechSynthesis.getVoices()
  return (
    voices.find((v) => WEB_SPEECH.preferredVoice.test(v.name)) ??
    voices.find((v) => v.lang.toLowerCase().startsWith("ar") || v.name.toLowerCase().includes("arabic")) ??
    voices[0] ??
    null
  )
}

export function webSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window
}

/** Resolves once the browser has listed its voices (they load asynchronously in Chrome and Edge). */
export function loadWebSpeechVoice(): Promise<SpeechSynthesisVoice | null> {
  if (!webSpeechSupported()) return Promise.reject(new Error("هذا المتصفح لا يدعم النطق"))
  voice = pickVoice()
  if (voice) return Promise.resolve(voice)
  return new Promise((resolve) => {
    const done = () => {
      voice = pickVoice()
      resolve(voice)
    }
    speechSynthesis.addEventListener("voiceschanged", done, { once: true })
    setTimeout(done, 3000)
  })
}

export function stopWebSpeech() {
  if (!webSpeechSupported()) return
  if (pendingStart) clearTimeout(pendingStart)
  pendingStart = null
  speechSynthesis.cancel()
}

// The utterance being spoken. Keeping a reference stops Chrome from
// garbage-collecting it mid-sentence, which silently ends speech and its events.
let current: SpeechSynthesisUtterance | null = null
let pendingStart: ReturnType<typeof setTimeout> | null = null

/** Speaks Arabic text, replacing anything already being spoken. */
export function speakWebSpeech(text: string, events: { onEnd: () => void; onError: (error: string) => void }) {
  if (pendingStart) clearTimeout(pendingStart)
  const busy = speechSynthesis.speaking || speechSynthesis.pending
  speechSynthesis.cancel()

  voice ??= pickVoice()
  const utterance = new SpeechSynthesisUtterance(text)
  if (voice) {
    utterance.voice = voice
    utterance.lang = voice.lang
  } else {
    utterance.lang = "ar"
  }
  utterance.rate = WEB_SPEECH.rate
  utterance.pitch = WEB_SPEECH.pitch
  utterance.volume = WEB_SPEECH.volume
  utterance.onend = () => {
    if (current === utterance) current = null
    events.onEnd()
  }
  utterance.onerror = (e) => {
    if (current === utterance) current = null
    // "interrupted"/"canceled" happen when a newer announcement replaces this one.
    if (e.error !== "interrupted" && e.error !== "canceled") events.onError(e.error)
  }

  const start = () => {
    pendingStart = null
    current = utterance
    // Chrome can get stuck in a paused state that silently swallows new speech.
    speechSynthesis.resume()
    speechSynthesis.speak(utterance)
  }
  // Speaking right after cancel() is sometimes dropped by Chrome and Edge,
  // so give the engine a moment when something was playing.
  if (busy) pendingStart = setTimeout(start, 150)
  else start()
}
