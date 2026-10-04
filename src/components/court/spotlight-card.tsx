import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { CourtCase } from "@/data/cases"
import { cn } from "@/lib/utils"

import { LiveDot } from "./status-badge"

interface SpotlightCardProps {
  variant: "current" | "next"
  courtCase?: CourtCase
  className?: string
}

const COPY = {
  current: { label: "Now in session", empty: "No case is being heard right now." },
  next: { label: "Up next", empty: "No more cases waiting today." },
}

/** Large, glanceable card for the case being heard and the one after it. */
export function SpotlightCard({ variant, courtCase, className }: SpotlightCardProps) {
  const isCurrent = variant === "current"

  return (
    <Card
      aria-live="polite"
      className={cn(
        "relative gap-5 overflow-hidden",
        isCurrent
          ? "border-live/30 bg-gradient-to-br from-live/12 via-card to-card"
          : "border-next/25 bg-gradient-to-br from-next/8 via-card to-card",
        className
      )}
    >
      <CardHeader className="flex items-center gap-2.5">
        {isCurrent ? <LiveDot /> : <span className="size-2.5 rounded-full bg-next" />}
        <span
          className={cn(
            "text-sm font-semibold uppercase tracking-[0.18em]",
            isCurrent ? "text-live" : "text-next"
          )}
        >
          {COPY[variant].label}
        </span>
      </CardHeader>

      <CardContent>
        {courtCase ? (
          <div className="space-y-5">
            <p
              key={courtCase.id}
              className={cn(
                "font-mono font-semibold tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-500",
                isCurrent ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"
              )}
            >
              {courtCase.caseNumber}
            </p>

            <div
              className={cn(
                "grid gap-4",
                isCurrent && "sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end"
              )}
            >
              <Party role="Plaintiff" name={courtCase.plaintiff} large={isCurrent} />
              {isCurrent && (
                <span className="hidden pb-1 text-lg font-medium text-muted-foreground italic sm:block">
                  v.
                </span>
              )}
              <Party role="Defendant" name={courtCase.defendant} large={isCurrent} />
            </div>
          </div>
        ) : (
          <p className="py-4 text-lg text-muted-foreground">{COPY[variant].empty}</p>
        )}
      </CardContent>
    </Card>
  )
}

function Party({ role, name, large }: { role: string; name: string; large: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{role}</p>
      <p
        className={cn(
          "mt-1 font-semibold text-balance",
          large ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"
        )}
      >
        {name}
      </p>
    </div>
  )
}
