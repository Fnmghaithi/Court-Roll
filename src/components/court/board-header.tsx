import { Landmark } from "lucide-react"
import { useState } from "react"

import { useNow } from "@/hooks/use-now"

// Served from public/ so the logo can be swapped without a code change.
const LOGO_SRC = `${import.meta.env.BASE_URL}sjc-logo.webp`

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
    <header className="grid grid-cols-2 items-center gap-x-4 gap-y-5 [grid-template-areas:'logo_logo'_'brand_clock'] sm:grid-cols-[1fr_auto_1fr] sm:[grid-template-areas:'brand_logo_clock']">
      <div className="flex items-center gap-3 [grid-area:brand] sm:gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground sm:size-12">
          <Landmark className="size-5 sm:size-6" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight sm:text-2xl">Court Roll</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Today's hearings</p>
        </div>
      </div>

      <Logo />

      <div className="text-right [grid-area:clock]">
        <p className="font-mono text-2xl font-semibold text-gold tabular-nums tracking-tight sm:text-4xl">
          <time dateTime={now.toISOString()}>{timeFormat.format(now)}</time>
        </p>
        <p className="text-xs text-muted-foreground sm:text-base">{dateFormat.format(now)}</p>
      </div>
    </header>
  )
}

function Logo() {
  const [failed, setFailed] = useState(false)
  if (failed) return null

  return (
    <img
      src={LOGO_SRC}
      alt="Supreme Judiciary Council"
      onError={() => setFailed(true)}
      className="h-14 w-auto justify-self-center [grid-area:logo] sm:h-20"
    />
  )
}
