import { Landmark } from "lucide-react"
import type { ReactNode } from "react"

import { useNow } from "@/hooks/use-now"

// Arabic wording with Western digits, to match how the court roll writes numbers.
const timeFormat = new Intl.DateTimeFormat("ar-OM", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  numberingSystem: "latn",
})
const dateFormat = new Intl.DateTimeFormat("ar-OM", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  numberingSystem: "latn",
})

interface BoardHeaderProps {
  title?: string
  /** Lines under the title, separated by a thin divider. */
  subtitle?: (string | undefined | null)[]
  /** Shown beside the clock (e.g. clerk actions). */
  actions?: ReactNode
  /** Hide the live clock (e.g. on pages that aren't about today). */
  showClock?: boolean
}

export function BoardHeader({ title = "جدول الجلسات اليومي", subtitle = [], actions, showClock = true }: BoardHeaderProps) {
  const now = useNow()
  const lines = subtitle.filter(Boolean)

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground sm:size-12">
          <Landmark className="size-5 sm:size-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold sm:text-2xl">{title}</h1>
          {lines.length > 0 && (
            <p className="text-sm text-muted-foreground sm:text-base">
              {lines.map((line, i) => (
                <span key={i}>
                  {i > 0 && (
                    <span className="mx-2 text-border" aria-hidden>
                      |
                    </span>
                  )}
                  {line}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>

      <div className="flex max-w-full flex-wrap items-center gap-3">
        {actions}
        {showClock && (
          <div className="text-end">
            <p className="font-mono text-2xl font-semibold text-gold tabular-nums sm:text-4xl">
              <time dateTime={now.toISOString()}>{timeFormat.format(now)}</time>
            </p>
            <p className="text-xs text-muted-foreground sm:text-base">{dateFormat.format(now)}</p>
          </div>
        )}
      </div>
    </header>
  )
}
