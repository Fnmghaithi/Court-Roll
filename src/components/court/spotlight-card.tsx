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
  current: { label: "جارٍ الآن", empty: "لا توجد قضية منظورة حالياً." },
  next: { label: "القضية التالية", empty: "لا توجد قضايا أخرى في الانتظار اليوم." },
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
          ? "border-gold/20 bg-cream"
          : "border-primary bg-primary text-primary-foreground",
        className
      )}
    >
      <CardHeader className="flex items-center gap-2.5">
        {isCurrent ? <LiveDot /> : <span className="size-2.5 rounded-full bg-primary-foreground/70" />}
        <span
          className={cn(
            "text-base font-bold",
            isCurrent ? "text-live" : "text-primary-foreground/80"
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
              <span dir="ltr">{courtCase.caseNumber}</span>
            </p>

            <div
              className={cn(
                "grid gap-4",
                isCurrent && "sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end"
              )}
            >
              <Party role="المستأنف" name={courtCase.plaintiff} large={isCurrent} onDark={!isCurrent} />
              {isCurrent && (
                <span className="hidden pb-1 text-lg font-semibold text-gold sm:block">ضد</span>
              )}
              <Party role="المستأنف ضده" name={courtCase.defendant} large={isCurrent} onDark={!isCurrent} />
            </div>
          </div>
        ) : (
          <p className={cn("py-4 text-lg", isCurrent ? "text-muted-foreground" : "text-primary-foreground/70")}>
            {COPY[variant].empty}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

interface PartyProps {
  role: string
  name: string
  large: boolean
  onDark: boolean
}

function Party({ role, name, large, onDark }: PartyProps) {
  return (
    <div className="min-w-0">
      <p
        className={cn(
          "text-sm font-medium",
          onDark ? "text-primary-foreground/60" : "text-muted-foreground"
        )}
      >
        {role}
      </p>
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
