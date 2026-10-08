import { Users } from "lucide-react"

import { Card } from "@/components/ui/card"
import type { HearingInfo } from "@/lib/api"

/** Judges and clerks of the session (أعضاء الهيئة). */
export function PanelMembers({ info, className }: { info: HearingInfo; className?: string }) {
  const people = [...(info.judges ?? []), ...(info.clerks ?? [])].filter(Boolean)
  if (people.length === 0) return null

  return (
    <Card className={`gap-3 px-6 py-5 ${className ?? ""}`}>
      <h2 className="flex items-center gap-2 text-sm font-bold text-primary">
        <Users aria-hidden className="size-4" />
        أعضاء الهيئة
      </h2>
      <ul className="space-y-1.5 text-sm sm:text-base">
        {people.map((person, i) => (
          <li key={i}>{person}</li>
        ))}
      </ul>
    </Card>
  )
}
