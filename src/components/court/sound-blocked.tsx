import { VolumeX } from "lucide-react"

import { useAnnouncer } from "@/hooks/use-announcer"
import { unlockAndReplay } from "@/lib/tts/announcer"

/**
 * Appears only when the browser refused to play an announcement because
 * nobody has interacted with the page yet. One click unlocks sound and replays it.
 */
export function SoundBlocked() {
  const { status, enabled } = useAnnouncer()
  if (!enabled || status.state !== "blocked") return null

  return (
    <button
      type="button"
      onClick={unlockAndReplay}
      className="fixed bottom-4 start-4 z-40 flex items-center gap-2 rounded-lg border border-destructive/25 bg-card px-4 py-3 text-sm font-bold text-destructive shadow-md focus-visible:outline-2 focus-visible:outline-primary"
    >
      <VolumeX aria-hidden className="size-4" />
      المتصفح أوقف النداء الصوتي — اضغط هنا لتفعيل الصوت
    </button>
  )
}
