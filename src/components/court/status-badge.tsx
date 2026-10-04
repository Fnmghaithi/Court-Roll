import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type DisplayStatus = "in_review" | "next" | "waiting"

const LABELS: Record<DisplayStatus, string> = {
  in_review: "In review",
  next: "Up next",
  waiting: "Waiting",
}

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex size-2.5", className)}>
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-75 motion-reduce:hidden" />
      <span className="relative inline-flex size-full rounded-full bg-live" />
    </span>
  )
}

export function StatusBadge({ status, className }: { status: DisplayStatus; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-2 px-3 py-1 text-sm",
        status === "in_review" && "border-live/25 bg-live-soft text-live",
        status === "next" && "border-primary/25 bg-card text-primary",
        status === "waiting" && "border-waiting/20 bg-waiting-soft text-waiting",
        className
      )}
    >
      {status === "in_review" ? (
        <LiveDot className="size-2" />
      ) : (
        <span
          className={cn(
            "size-2 rounded-full",
            status === "next" ? "bg-primary" : "bg-waiting"
          )}
        />
      )}
      {LABELS[status]}
    </Badge>
  )
}
