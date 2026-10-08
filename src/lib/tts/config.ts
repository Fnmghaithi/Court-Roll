/**
 * Which engine announces cases on the hearing schedule.
 *
 *   "webspeech"  – the browser's built-in voices (Microsoft Naayf on Windows/Edge),
 *                  as in the original page. No download.
 *   "supertonic" – Supertonic 3, running on the device (see README → Voice announcements).
 *
 * Change this one line to switch. (A build can also set VITE_TTS_ENGINE.)
 */
export const TTS_ENGINE: TtsEngine = (import.meta.env.VITE_TTS_ENGINE as TtsEngine | undefined) ?? "webspeech"

export type TtsEngine = "webspeech" | "supertonic"

/** Settings for the browser voice, matching the original page. */
export const WEB_SPEECH = {
  /** Preferred voice; otherwise the first Arabic voice, otherwise the first voice. */
  preferredVoice: /naayf|نايف/i,
  rate: 2.2,
  pitch: 0.5,
  volume: 1,
}
