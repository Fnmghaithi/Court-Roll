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
import { reverseCaseNumber, type CourtCase } from "@/lib/api"
import { CASE_STATUSES, isFinished, PARTY_LABELS, STATUS_LABELS, type CaseStatus } from "@/lib/case-status"
import { cn } from "@/lib/utils"

import { AutoScroll } from "./auto-scroll"
import { StatusBadge } from "./status-badge"

interface CaseListProps {
  cases: CourtCase[]
  title?: string
  /** When set, rows become clickable so the clerk can change a case's status. */
  onStatusChange?: (courtCase: CourtCase, status: CaseStatus) => void
  /** Called after each full pass of the scrolling list (or a pause when it fits). */
  onCycle?: () => void
  className?: string
}

/** Arabic count of cases, following the noun's agreement with the number. */
function formatCaseCount(count: number) {
  if (count === 1) return "قضية واحدة"
  if (count === 2) return "قضيتان"
  if (count >= 3 && count <= 10) return `${count} قضايا`
  return `${count} قضية`
}

// Shared column templates so the header lines up with the rows.
const COLUMNS =
  "md:grid md:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_10rem] md:items-center md:gap-6"
const COLUMNS_WITH_PROSECUTION =
  "md:grid md:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_10rem] md:items-center md:gap-6"

export function CaseList({ cases, title = "جدول قضايا اليوم", onStatusChange, onCycle, className }: CaseListProps) {
  const isClerk = Boolean(onStatusChange)
  const withProsecution = cases.some((c) => c.publicProsecutionNumber)
  const columns = withProsecution ? COLUMNS_WITH_PROSECUTION : COLUMNS

  return (
    <Card className={cn("min-h-0 gap-0 overflow-hidden border-0 py-0", className)}>
      <CardHeader className="flex items-center justify-between border-b border-primary-foreground/10 bg-primary py-5 text-primary-foreground">
        <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
        <span className="text-sm text-primary-foreground/70">{formatCaseCount(cases.length)}</span>
      </CardHeader>

      <div className={cn("hidden bg-primary px-6 py-3 text-sm font-medium text-primary-foreground/85", columns)}>
        <span>م</span>
        <span>رقم الدعوى</span>
        {withProsecution && <span>رقم الإدعاء العام</span>}
        <span>{PARTY_LABELS.plaintiff}</span>
        <span>{PARTY_LABELS.defendant}</span>
        <span>الحالة</span>
      </div>

      {/* The clerk needs the list to hold still to click a row. */}
      <AutoScroll className="flex-1" enabled={!isClerk} onCycle={onCycle}>
        <ol className="divide-y divide-border/70">
          {cases.map((courtCase, index) => (
            <CaseRow
              key={courtCase.caseId}
              index={index}
              courtCase={courtCase}
              columns={columns}
              withProsecution={withProsecution}
              onStatusChange={onStatusChange}
            />
          ))}
        </ol>
      </AutoScroll>
    </Card>
  )
}

interface CaseRowProps {
  index: number
  courtCase: CourtCase
  columns: string
  withProsecution: boolean
  onStatusChange?: (courtCase: CourtCase, status: CaseStatus) => void
}

function CaseRow({ index, courtCase, columns, withProsecution, onStatusChange }: CaseRowProps) {
  const status = courtCase.caseStatus
  const finished = isFinished(status)
  const rowClassName = cn(
    "relative grid w-full grid-cols-[auto_minmax(0,1fr)_auto] gap-x-4 gap-y-1 px-6 py-4 text-start",
    columns,
    status === "in-progress" ? "bg-row-current" : index % 2 === 1 ? "bg-row-alt" : "bg-card"
  )

  const content = (
    <>
      {status === "in-progress" && <span aria-hidden className="absolute inset-y-0 start-0 w-1 bg-gold" />}
      <span className={cn("font-mono text-sm font-semibold text-gold tabular-nums md:text-lg", finished && "opacity-50")}>
        {String(courtCase.rowNumber ?? index + 1).padStart(2, "0")}
      </span>
      <span className={cn("flex flex-col", finished && "opacity-50")}>
        <span dir="ltr" className="self-start font-mono font-semibold tracking-tight md:text-lg">
          {reverseCaseNumber(courtCase.caseNumber)}
        </span>
        {courtCase.publicProsecutionNumber && (
          <span className="text-xs text-muted-foreground md:hidden">
            الإدعاء العام: <span dir="ltr">{reverseCaseNumber(courtCase.publicProsecutionNumber)}</span>
          </span>
        )}
      </span>
      <span className="flex items-center gap-1.5 md:order-last">
        <StatusBadge status={status} />
        {onStatusChange && <ChevronDown aria-hidden className="size-4 text-muted-foreground" />}
      </span>
      {withProsecution && (
        <span dir="ltr" className={cn("hidden self-center justify-self-start font-mono md:block md:text-lg", finished && "opacity-50")}>
          {reverseCaseNumber(courtCase.publicProsecutionNumber)}
        </span>
      )}
      <span className={cn("col-span-3 col-start-2 md:col-span-1 md:col-start-auto md:text-lg", finished && "opacity-50")}>
        <span className="sr-only">{PARTY_LABELS.plaintiff}: </span>
        {courtCase.plaintiff}
        <span className="font-semibold text-gold md:hidden"> ضد </span>
      </span>
      <span
        className={cn(
          "col-span-3 col-start-2 -mt-1 md:col-span-1 md:col-start-auto md:mt-0 md:text-lg",
          finished && "opacity-50"
        )}
      >
        <span className="sr-only">{PARTY_LABELS.defendant}: </span>
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
            aria-label={`تغيير حالة القضية ${reverseCaseNumber(courtCase.caseNumber)}`}
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
            حالة القضية <span dir="ltr">{reverseCaseNumber(courtCase.caseNumber)}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={status}
            onValueChange={(value) => value !== status && onStatusChange(courtCase, value as CaseStatus)}
          >
            {CASE_STATUSES.map((option) => (
              <DropdownMenuRadioItem key={option} value={option} className="text-base">
                {STATUS_LABELS[option]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}
