import { Landmark } from "lucide-react"

import { SESSION_INFO } from "@/data/cases"
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

export function BoardHeader() {
  const now = useNow()

  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground sm:size-12">
          <Landmark className="size-5 sm:size-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold sm:text-2xl">جدول الجلسات اليومي</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {SESSION_INFO.court}
            <span className="mx-2 text-border" aria-hidden>
              |
            </span>
            {SESSION_INFO.hall}
          </p>
        </div>
      </div>

      <div className="shrink-0 text-end">
        <p className="font-mono text-2xl font-semibold text-gold tabular-nums sm:text-4xl">
          <time dateTime={now.toISOString()}>{timeFormat.format(now)}</time>
        </p>
        <p className="text-xs text-muted-foreground sm:text-base">{dateFormat.format(now)}</p>
      </div>
    </header>
  )
}
