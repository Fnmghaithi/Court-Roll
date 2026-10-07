import { Loader2, Settings2, Volume2, VolumeX } from "lucide-react"

import { useAnnouncer } from "@/hooks/use-announcer"
import { setAnnouncementsEnabled, type AnnouncerStatus } from "@/lib/tts/announcer"
import { cn } from "@/lib/utils"

function statusText(status: AnnouncerStatus) {
  switch (status.state) {
    case "idle":
      return "يُحمَّل عند أول استخدام"
    case "loading":
      return `جارٍ تحميل نموذج الصوت (${status.loaded}/${status.total})`
    case "ready":
      return "جاهز"
    case "speaking":
      return "جارٍ النداء…"
    case "error":
      return "تعذّر تحميل نموذج الصوت"
  }
}

export function AdminBanner() {
  const { enabled, status } = useAnnouncer()
  const busy = enabled && (status.state === "loading" || status.state === "speaking")

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl border border-primary/20 bg-card px-4 py-3 text-sm text-primary sm:text-base"
    >
      <div className="flex items-center gap-3">
        <Settings2 aria-hidden className="size-5 shrink-0" />
        <p>
          <span className="font-bold">وضع الإدارة</span>
          <span className="mx-2 text-primary/40" aria-hidden>
            |
          </span>
          اضغط على أي قضية في الجدول لتغيير حالتها.
        </p>
      </div>

      <div className="flex items-center gap-3 text-muted-foreground">
        {enabled && (
          <span
            className={cn("flex items-center gap-1.5", status.state === "error" && "text-destructive")}
            title={status.state === "error" ? status.message : undefined}
          >
            {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
            النداء الصوتي: {statusText(status)}
          </span>
        )}
        <button
          type="button"
          onClick={() => setAnnouncementsEnabled(!enabled)}
          aria-pressed={enabled}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            enabled
              ? "border-primary/25 text-primary hover:bg-primary/5"
              : "border-border text-muted-foreground hover:bg-muted"
          )}
        >
          {enabled ? <Volume2 aria-hidden className="size-4" /> : <VolumeX aria-hidden className="size-4" />}
          {enabled ? "إيقاف النداء الصوتي" : "تشغيل النداء الصوتي"}
        </button>
      </div>
    </div>
  )
}
