import { Landmark } from "lucide-react"

import { useNow } from "@/hooks/use-now"

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" })
const dateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
})

export function BoardHeader() {
  const now = useNow()

  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground sm:size-12">
          <Landmark className="size-5 sm:size-6" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight sm:text-2xl">Court Roll</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Today's hearings</p>
        </div>
      </div>

      <div className="text-right">
        <p className="font-mono text-2xl font-semibold text-gold tabular-nums tracking-tight sm:text-4xl">
          <time dateTime={now.toISOString()}>{timeFormat.format(now)}</time>
        </p>
        <p className="text-xs text-muted-foreground sm:text-base">{dateFormat.format(now)}</p>
      </div>
    </header>
  )
}
