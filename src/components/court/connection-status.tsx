import type { HubState } from "@/hooks/use-session-hub"
import { cn } from "@/lib/utils"

const TEXT: Record<HubState, string> = {
  connecting: "جاري الاتصال...",
  connected: "متصل بالخادم",
  reconnecting: "جاري إعادة الاتصال...",
  disconnected: "غير متصل",
}

/** Live-updates indicator: shown while connecting or offline, and for a few seconds once connected. */
export function ConnectionStatus({ state }: { state: HubState }) {
  return (
    <div
      // Remounting on each change restarts the fade-out for "connected".
      key={state}
      role="status"
      className={cn(
        "fixed bottom-4 end-4 z-40 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm",
        state === "connected" && "animate-hide-after border-live/25 bg-live-soft text-live",
        (state === "connecting" || state === "reconnecting") && "border-waiting/25 bg-waiting-soft text-waiting",
        state === "disconnected" && "border-destructive/25 bg-card text-destructive"
      )}
    >
      <span className="size-2 rounded-full bg-current" />
      {TEXT[state]}
    </div>
  )
}
