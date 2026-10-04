import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import type { CourtCase } from "@/data/cases"
import { cn } from "@/lib/utils"

import { AutoScroll } from "./auto-scroll"
import { StatusBadge, type DisplayStatus } from "./status-badge"

interface CaseListProps {
  cases: CourtCase[]
  nextId?: string
  className?: string
}

// Shared column template so the header lines up with the scrolling rows.
const COLUMNS =
  "md:grid md:grid-cols-[2.5rem_minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_8.5rem] md:items-center md:gap-6"

export function CaseList({ cases, nextId, className }: CaseListProps) {
  return (
    <Card className={cn("min-h-0 gap-0 py-0", className)}>
      <CardHeader className="flex items-center justify-between border-b py-5">
        <CardTitle className="text-lg sm:text-xl">Today's cases</CardTitle>
        <span className="text-sm text-muted-foreground">
          {cases.length} {cases.length === 1 ? "case" : "cases"}
        </span>
      </CardHeader>

      <div
        className={cn(
          "hidden border-b px-6 py-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground",
          COLUMNS
        )}
      >
        <span>#</span>
        <span>Case no.</span>
        <span>Plaintiff</span>
        <span>Defendant</span>
        <span>Status</span>
      </div>

      <AutoScroll className="flex-1">
        <ol className="divide-y">
          {cases.map((courtCase, index) => (
            <CaseRow
              key={courtCase.id}
              position={index + 1}
              courtCase={courtCase}
              status={
                courtCase.status === "in_review"
                  ? "in_review"
                  : courtCase.id === nextId
                    ? "next"
                    : "waiting"
              }
            />
          ))}
        </ol>
      </AutoScroll>
    </Card>
  )
}

interface CaseRowProps {
  position: number
  courtCase: CourtCase
  status: DisplayStatus
}

function CaseRow({ position, courtCase, status }: CaseRowProps) {
  return (
    <li
      className={cn(
        "relative grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-4 gap-y-1 px-6 py-4",
        COLUMNS,
        status === "in_review" && "bg-live/10",
        status === "next" && "bg-next/5"
      )}
    >
      {status !== "waiting" && (
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-0 left-0 w-1",
            status === "in_review" ? "bg-live" : "bg-next"
          )}
        />
      )}
      <span className="font-mono text-sm text-muted-foreground tabular-nums md:text-base">
        {String(position).padStart(2, "0")}
      </span>
      <span className="font-mono font-semibold tracking-tight md:text-lg">
        {courtCase.caseNumber}
      </span>
      <StatusBadge status={status} className="md:order-last" />
      <span className="col-span-3 col-start-2 md:col-span-1 md:col-start-auto md:text-lg">
        <span className="sr-only">Plaintiff: </span>
        {courtCase.plaintiff}
        <span className="text-muted-foreground md:hidden"> v. </span>
      </span>
      <span className="col-span-3 col-start-2 -mt-1 md:col-span-1 md:col-start-auto md:mt-0 md:text-lg">
        <span className="sr-only">Defendant: </span>
        {courtCase.defendant}
      </span>
    </li>
  )
}
