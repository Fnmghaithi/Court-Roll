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
  if (webSpeechSupported()) speechSynthesis.cancel()
}

/** Speaks Arabic text, replacing anything already being spoken. */
export function speakWebSpeech(text: string, events: { onEnd: () => void; onError: (error: string) => void }) {
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
  utterance.onend = events.onEnd
  utterance.onerror = (e) => {
    // "interrupted"/"canceled" happen when a newer announcement replaces this one.
    if (e.error !== "interrupted" && e.error !== "canceled") events.onError(e.error)
  }
  speechSynthesis.speak(utterance)
}
