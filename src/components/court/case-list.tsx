import { ChevronDown } from "lucide-react"

import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { CaseListing, CaseStatus, CourtCase } from "@/data/cases"
import { STATUS_LABELS } from "@/lib/status-labels"
import { cn } from "@/lib/utils"

import { AutoScroll } from "./auto-scroll"
import { StatusBadge } from "./status-badge"

interface CaseListProps {
  cases: CourtCase[]
  nextId?: string
  /** When set, rows become clickable so an admin can change a case's status. */
  onStatusChange?: (id: string, status: CaseStatus) => void
  className?: string
}

const LISTING_LABELS: Record<CaseListing, string> = {
  judgment: "محجوزة للحكم",
  pleading: "مرافعة",
}

// Statuses an admin can pick, in the order they appear in the menu.
const ADMIN_STATUSES: CaseStatus[] = ["in_review", "next", "discussed", "judged"]

/** Arabic count of cases, following the noun's agreement with the number. */
function formatCaseCount(count: number) {
  if (count === 1) return "قضية واحدة"
  if (count === 2) return "قضيتان"
  if (count >= 3 && count <= 10) return `${count} قضايا`
  return `${count} قضية`
}

// Shared column template so the header lines up with the scrolling rows.
const COLUMNS =
  "md:grid md:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_10rem] md:items-center md:gap-6"

export function CaseList({ cases, nextId, onStatusChange, className }: CaseListProps) {
  const isAdmin = Boolean(onStatusChange)

  return (
    <Card className={cn("min-h-0 gap-0 overflow-hidden border-0 py-0", className)}>
      <CardHeader className="flex items-center justify-between border-b border-primary-foreground/10 bg-primary py-5 text-primary-foreground">
        <CardTitle className="text-lg sm:text-xl">جدول قضايا اليوم</CardTitle>
        <span className="text-sm text-primary-foreground/70">{formatCaseCount(cases.length)}</span>
      </CardHeader>

      <div
        className={cn(
          "hidden bg-primary px-6 py-3 text-sm font-medium text-primary-foreground/85",
          COLUMNS
        )}
      >
        <span>م</span>
        <span>رقم الدعوى</span>
        <span>المستأنف</span>
        <span>المستأنف ضده</span>
        <span>الحالة</span>
      </div>

      {/* Admins need the list to hold still so they can click a row. */}
      <AutoScroll className="flex-1" enabled={!isAdmin}>
        <ol className="divide-y divide-border/70">
          {cases.map((courtCase, index) => (
            <CaseRow
              key={courtCase.id}
              position={index + 1}
              courtCase={courtCase}
              status={
                courtCase.status === "waiting" && courtCase.id === nextId ? "next" : courtCase.status
              }
              onStatusChange={onStatusChange}
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
  /** The status to show, which can differ from the stored one for the derived next case. */
  status: CaseStatus
  onStatusChange?: (id: string, status: CaseStatus) => void
}

function CaseRow({ position, courtCase, status, onStatusChange }: CaseRowProps) {
  const finished = status === "discussed" || status === "judged"
  const rowClassName = cn(
    "relative grid w-full grid-cols-[auto_minmax(0,1fr)_auto] gap-x-4 gap-y-1 px-6 py-4 text-start",
    COLUMNS,
    status === "in_review" ? "bg-row-current" : position % 2 === 0 ? "bg-row-alt" : "bg-card"
  )

  const content = (
    <>
      {status === "in_review" && (
        <span aria-hidden className="absolute inset-y-0 start-0 w-1 bg-gold" />
      )}
      <span
        className={cn(
          "font-mono text-sm font-semibold text-gold tabular-nums md:text-lg",
          finished && "opacity-50"
        )}
      >
        {String(position).padStart(2, "0")}
      </span>
      <span className={cn("flex flex-col", finished && "opacity-50")}>
        <span dir="ltr" className="self-start font-mono font-semibold tracking-tight md:text-lg">
          {courtCase.caseNumber}
        </span>
        <span className="text-xs text-muted-foreground md:text-sm">
          {LISTING_LABELS[courtCase.listing]}
        </span>
      </span>
      <span className="flex items-center gap-1.5 md:order-last">
        <StatusBadge status={status} />
        {onStatusChange && <ChevronDown aria-hidden className="size-4 text-muted-foreground" />}
      </span>
      <span
        className={cn(
          "col-span-3 col-start-2 md:col-span-1 md:col-start-auto md:text-lg",
          finished && "opacity-50"
        )}
      >
        <span className="sr-only">المستأنف: </span>
        {courtCase.plaintiff}
        <span className="font-semibold text-gold md:hidden"> ضد </span>
      </span>
      <span
        className={cn(
          "col-span-3 col-start-2 -mt-1 md:col-span-1 md:col-start-auto md:mt-0 md:text-lg",
          finished && "opacity-50"
        )}
      >
        <span className="sr-only">المستأنف ضده: </span>
        {courtCase.defendant}
      </span>
    </>
  )

  if (!onStatusChange) {
    return (
      <li>
        <div className={rowClassName}>{content}</div>
      </li>
    )
  }

  return (
    <li>
      <DropdownMenu dir="rtl" modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`تغيير حالة القضية ${courtCase.caseNumber}`}
            className={cn(
              rowClassName,
              "cursor-pointer transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary data-[state=open]:bg-accent"
            )}
          >
            {content}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-muted-foreground">
            حالة القضية <span dir="ltr">{courtCase.caseNumber}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={courtCase.status}
            onValueChange={(value) => onStatusChange(courtCase.id, value as CaseStatus)}
          >
            {ADMIN_STATUSES.map((option) => (
              <DropdownMenuRadioItem key={option} value={option} className="text-base">
                {STATUS_LABELS[option]}
              </DropdownMenuRadioItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuRadioItem value="waiting" className="text-base">
              {STATUS_LABELS.waiting}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}
