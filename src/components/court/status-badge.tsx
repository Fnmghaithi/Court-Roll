import { Check } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { CaseStatus } from "@/data/cases"
import { STATUS_LABELS } from "@/lib/status-labels"
import { cn } from "@/lib/utils"

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex size-2.5", className)}>
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-75 motion-reduce:hidden" />
      <span className="relative inline-flex size-full rounded-full bg-live" />
    </span>
  )
}

const STYLES: Record<CaseStatus, string> = {
  in_review: "border-live/25 bg-live-soft text-live",
  next: "border-primary/25 bg-card text-primary",
  waiting: "border-waiting/20 bg-waiting-soft text-waiting",
  discussed: "border-border bg-muted text-muted-foreground",
  judged: "border-foreground/15 bg-secondary text-foreground/75",
}

const DOTS: Partial<Record<CaseStatus, string>> = {
  next: "bg-primary",
  waiting: "bg-waiting",
  discussed: "bg-muted-foreground/60",
}

export function StatusBadge({ status, className }: { status: CaseStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("gap-2 px-3 py-1 text-sm", STYLES[status], className)}>
      {status === "in_review" ? (
        <LiveDot className="size-2" />
      ) : status === "judged" ? (
        <Check className="size-3.5" />
      ) : (
        <span className={cn("size-2 rounded-full", DOTS[status])} />
      )}
      {STATUS_LABELS[status]}
    </Badge>
  )
}
