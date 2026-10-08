import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

import { BoardHeader } from "@/components/court/board-header"
import { CaseList } from "@/components/court/case-list"
import { ConnectionStatus } from "@/components/court/connection-status"
import { ErrorState, LoadingState, PageShell } from "@/components/court/page-shell"
import { PanelMembers } from "@/components/court/panel-members"
import { SessionPicker } from "@/components/court/session-picker"
import { SoundBlocked } from "@/components/court/sound-blocked"
import { SpotlightCard } from "@/components/court/spotlight-card"
import { ToolsMenu } from "@/components/court/tools-menu"
import { Button } from "@/components/ui/button"
import { useSessionHub } from "@/hooks/use-session-hub"
import { api, sessionLabel, type SessionDetail, type SessionSummary } from "@/lib/api"
import type { CaseStatus } from "@/lib/case-status"
import { readPageTarget, showDayInUrl, showSessionInUrl, siblingsOf, type DaySessions } from "@/lib/day-sessions"
import { announceCase, preloadAnnouncer } from "@/lib/tts/announcer"

type Phase = { name: "loading" } | { name: "error"; message: string } | { name: "pick" } | { name: "board" }

/**
 * The audience board (hearing-schedule.html). Opened with ?session=<id>, or
 * ?court=&hall=&date= for a day's sessions in a hall. Without either it goes to
 * the admin dashboard, as before.
 */
export function HearingSchedule() {
  const target = useMemo(() => readPageTarget(), [])
  const [phase, setPhase] = useState<Phase>({ name: "loading" })
  const [day, setDay] = useState<DaySessions | null>(null)
  const [details, setDetails] = useState<Record<number, SessionDetail>>({})
  const [currentId, setCurrentId] = useState<number | null>(null)

  useEffect(() => {
    if (!target) window.location.href = "/admin-dashboard.html"
    else preloadAnnouncer()
  }, [target])

  // Load the session (or the day's sessions) and every session's cases, so a
  // case called in any of them can be found and shown.
  useEffect(() => {
    if (!target) return
    let cancelled = false
    ;(async () => {
      try {
        let dayInfo: DaySessions
        let first: SessionDetail | null = null
        if ("sessionId" in target) {
          first = await api.session(target.sessionId)
          dayInfo = await siblingsOf(first)
        } else {
          const summaries = await api.sessionsByDate(target.courtId, target.hallId, target.date)
          if (summaries.length === 0) throw new Error("لا توجد جلسات في هذا التاريخ")
          dayInfo = { ...target, summaries }
        }

        const loaded = await Promise.all(
          dayInfo.summaries.map((s) =>
            s.sessionId === first?.sessionId ? first : api.session(s.sessionId).catch(() => null)
          )
        )
        if (cancelled) return
        setDay(dayInfo)
        setDetails(Object.fromEntries(loaded.filter((d): d is SessionDetail => !!d).map((d) => [d.sessionId, d])))

        if (first) {
          setCurrentId(first.sessionId)
          setPhase({ name: "board" })
        } else if (dayInfo.summaries.length > 1) {
          setPhase({ name: "pick" })
        } else {
          setCurrentId(dayInfo.summaries[0].sessionId)
          setPhase({ name: "board" })
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : String(error)
          setPhase({ name: "error", message: `فشل تحميل الجلسة: ${message}` })
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [target])

  const openSession = useCallback((sessionId: number) => {
    setCurrentId(sessionId)
    setPhase({ name: "board" })
    showSessionInUrl(sessionId)
  }, [])

  const showPicker = useCallback(() => {
    setPhase({ name: "pick" })
    if (day) showDayInUrl(day.courtId, day.hallId, day.date)
  }, [day])

  // Live updates for all of the day's sessions.
  const detailsRef = useRef(details)
  const currentRef = useRef(currentId)
  useLayoutEffect(() => {
    detailsRef.current = details
    currentRef.current = currentId
  })

  const onStatusChanged = useCallback(
    (caseId: number, status: CaseStatus) => {
      const owner = Object.values(detailsRef.current).find((s) => s.cases.some((c) => c.caseId === caseId))
      if (!owner) return

      setDetails((prev) => {
        const session = prev[owner.sessionId]
        if (!session) return prev
        return {
          ...prev,
          [owner.sessionId]: {
            ...session,
            cases: session.cases.map((c) => (c.caseId === caseId ? { ...c, caseStatus: status } : c)),
          },
        }
      })

      if (status === "in-progress") {
        // A case called in another of today's sessions: switch to that session, then announce.
        if (owner.sessionId !== currentRef.current) openSession(owner.sessionId)
        const courtCase = owner.cases.find((c) => c.caseId === caseId)
        if (courtCase) announceCase(courtCase)
      }
    },
    [openSession]
  )

  const sessionIds = useMemo(() => day?.summaries.map((s) => s.sessionId) ?? [], [day])
  const hubState = useSessionHub(sessionIds, onStatusChanged)

  // After each pass of the list, move to the next session, but stay on (or go
  // to) a session whose case is being heard.
  const onCycle = useCallback(() => {
    if (!day || day.summaries.length < 2) return
    const ids = day.summaries.map((s) => s.sessionId)
    const live = ids.find((id) => detailsRef.current[id]?.cases.some((c) => c.caseStatus === "in-progress"))
    const current = currentRef.current
    if (live !== undefined) {
      if (live !== current) openSession(live)
      return
    }
    const next = ids[(ids.indexOf(current ?? ids[0]) + 1) % ids.length]
    if (next !== current) openSession(next)
  }, [day, openSession])

  const session = currentId !== null ? details[currentId] : undefined
  const multiple = (day?.summaries.length ?? 0) > 1

  return (
    <PageShell fullHeight={phase.name === "board"}>
      <ToolsMenu onShowSessions={multiple ? showPicker : undefined} />
      <SoundBlocked />
      {day && <ConnectionStatus state={hubState} />}

      {phase.name === "loading" && <LoadingState />}
      {phase.name === "error" && (
        <ErrorState message={phase.message}>
          <Button asChild variant="outline">
            <a href="/admin-dashboard.html">العودة للوحة التحكم</a>
          </Button>
        </ErrorState>
      )}
      {phase.name === "pick" && day && (
        <>
          <BoardHeader subtitle={[day.summaries[0]?.hearingInfo.courtName, day.summaries[0]?.hearingInfo.courtHall]} />
          <SessionPicker sessions={day.summaries} onSelect={(s: SessionSummary) => openSession(s.sessionId)} />
        </>
      )}
      {phase.name === "board" && session && (
        <Board session={session} label={multiple ? sessionLabel(session) : undefined} onCycle={multiple ? onCycle : undefined} />
      )}
      {phase.name === "board" && !session && <ErrorState message="فشل تحميل الجلسة" />}
    </PageShell>
  )
}

function Board({ session, label, onCycle }: { session: SessionDetail; label?: string; onCycle?: () => void }) {
  const info = session.hearingInfo
  const current = session.cases.find((c) => c.caseStatus === "in-progress")
  const next = session.cases.find((c) => c.caseStatus === "upcoming-next")

  return (
    <>
      <BoardHeader
        subtitle={[info.courtName || session.courtName, info.courtHall || session.hallName, `${info.hearingDay} | ${info.hearingDate}`, label]}
      />
      <main className="grid flex-1 gap-6 lg:min-h-0 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section aria-label="القضية الحالية والتالية" className="flex flex-col gap-6 lg:min-h-0">
          <SpotlightCard variant="current" courtCase={current} className="lg:flex-1 lg:justify-center" />
          <SpotlightCard variant="next" courtCase={next} />
          <PanelMembers info={info} />
        </section>
        {/* Keyed by session so switching sessions restarts the scroll from the top. */}
        <CaseList key={session.sessionId} cases={session.cases} onCycle={onCycle} className="lg:h-full" />
      </main>
    </>
  )
}
