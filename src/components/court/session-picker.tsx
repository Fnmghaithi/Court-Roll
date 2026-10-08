import { CalendarClock, ClipboardList, Gavel } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { formatTime, sessionLabel, type SessionSummary } from "@/lib/api"
import { STATUS_LABELS } from "@/lib/case-status"

interface SessionPickerProps {
  sessions: SessionSummary[]
  onSelect: (session: SessionSummary) => void
  /** Show counts per status (clerk panel). */
  showStats?: boolean
}

/** Choose one of a day's sessions in a hall. */
export function SessionPicker({ sessions, onSelect, showStats = false }: SessionPickerProps) {
  const info = sessions[0]?.hearingInfo

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary">اختر الجلسة</h2>
        {info && (
          <p className="mt-2 text-muted-foreground">
            توجد {sessions.length} جلسات في {info.courtName} - {info.courtHall}
            <br />
            {info.hearingDay} | {info.hearingDate}
          </p>
        )}
      </div>

      <ol className="flex flex-col gap-4">
        {sessions.map((session, index) => {
          const waiting = session.totalCases - session.discussedCases - session.rulingIssuedCases - session.inProgressCases
          return (
            <li key={session.sessionId}>
              <Card className="py-0 transition-shadow hover:shadow-md">
                <button
                  type="button"
                  onClick={() => onSelect(session)}
                  className="flex w-full items-center gap-6 rounded-xl p-6 text-start focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <span className="font-mono text-4xl font-semibold text-gold tabular-nums">{index + 1}</span>
                  <span className="flex min-w-0 flex-1 flex-col gap-2">
                    <span className="flex flex-wrap items-center gap-3">
                      <span className="text-xl font-bold text-primary">{sessionLabel(session)}</span>
                      {session.inProgressCases > 0 && (
                        <Badge variant="outline" className="border-live/25 bg-live-soft text-live">
                          جلسة نشطة
                        </Badge>
                      )}
                    </span>
                    <span className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <CalendarClock aria-hidden className="size-4" />
                        الوقت: {session.sessionTime ? formatTime(session.sessionTime) : "غير محدد"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ClipboardList aria-hidden className="size-4" />
                        عدد القضايا: {session.totalCases}
                      </span>
                      {session.hearingInfo.judges?.[0] && (
                        <span className="flex items-center gap-1.5">
                          <Gavel aria-hidden className="size-4" />
                          {session.hearingInfo.judges[0]}
                        </span>
                      )}
                    </span>
                    {showStats && (
                      <span className="flex flex-wrap gap-2 text-sm">
                        <Badge variant="outline" className="border-waiting/20 bg-waiting-soft text-waiting">
                          {STATUS_LABELS["in-review"]}: {waiting}
                        </Badge>
                        {session.inProgressCases > 0 && (
                          <Badge variant="outline" className="border-live/25 bg-live-soft text-live">
                            {STATUS_LABELS["in-progress"]}: {session.inProgressCases}
                          </Badge>
                        )}
                        {session.discussedCases > 0 && (
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            {STATUS_LABELS.discussed}: {session.discussedCases}
                          </Badge>
                        )}
                        {session.rulingIssuedCases > 0 && (
                          <Badge variant="outline" className="bg-secondary text-foreground/75">
                            {STATUS_LABELS["ruling-issued"]}: {session.rulingIssuedCases}
                          </Badge>
                        )}
                      </span>
                    )}
                  </span>
                </button>
              </Card>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
