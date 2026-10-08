import { ArrowRight, ListOrdered, MousePointerClick, Share2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { BoardHeader } from "@/components/court/board-header"
import { CaseList } from "@/components/court/case-list"
import { ConnectionStatus } from "@/components/court/connection-status"
import { ErrorState, LoadingState, PageShell } from "@/components/court/page-shell"
import { SessionPicker } from "@/components/court/session-picker"
import { SpotlightCard } from "@/components/court/spotlight-card"
import { Button } from "@/components/ui/button"
import { useSessionHub } from "@/hooks/use-session-hub"
import { api, sessionLabel, type CourtCase, type SessionDetail, type SessionSummary } from "@/lib/api"
import type { CaseStatus } from "@/lib/case-status"
import { readPageTarget, showDayInUrl, showSessionInUrl, siblingsOf, type DaySessions } from "@/lib/day-sessions"

/** Sent with every status change, as in the original clerk panel. */
const MODIFIED_BY = "أمين السر"

type Phase = { name: "loading" } | { name: "error"; message: string } | { name: "pick" } | { name: "board" }

/** The clerk's control panel (clerk-panel.html?session=<id> or ?court=&hall=&date=). */
export function ClerkPanel() {
  const target = useMemo(() => readPageTarget(), [])
  const [phase, setPhase] = useState<Phase>(() =>
    target ? { name: "loading" } : { name: "error", message: "الرجاء تحديد الجلسة من خلال الرابط الصحيح" }
  )
  const [day, setDay] = useState<DaySessions | null>(null)
  const [session, setSession] = useState<SessionDetail | null>(null)

  const fail = (error: unknown, prefix: string) => {
    const message = error instanceof Error ? error.message : String(error)
    setPhase({ name: "error", message: `${prefix}: ${message}` })
  }

  const loadSession = useCallback(async (sessionId: number) => {
    try {
      const detail = await api.session(sessionId)
      setSession(detail)
      setPhase({ name: "board" })
      // The day's other sessions, for the "sessions list" button.
      siblingsOf(detail).then(setDay)
    } catch (error) {
      fail(error, "فشل تحميل الجلسة")
    }
  }, [])

  useEffect(() => {
    if (!target) return
    if ("sessionId" in target) {
      void loadSession(target.sessionId)
      return
    }
    api
      .sessionsByDate(target.courtId, target.hallId, target.date)
      .then((summaries) => {
        if (summaries.length === 0) {
          setPhase({ name: "error", message: "لا توجد جلسات في هذا التاريخ" })
        } else if (summaries.length === 1) {
          void loadSession(summaries[0].sessionId)
        } else {
          setDay({ ...target, summaries })
          setPhase({ name: "pick" })
        }
      })
      .catch((error) => fail(error, "فشل تحميل الجلسات"))
  }, [target, loadSession])

  const openSession = (s: SessionSummary) => {
    setPhase({ name: "loading" })
    showSessionInUrl(s.sessionId)
    void loadSession(s.sessionId)
  }

  const showPicker = async () => {
    if (!day) return
    showDayInUrl(day.courtId, day.hallId, day.date)
    setPhase({ name: "pick" })
    // Refresh the counts, which change as the clerk works.
    try {
      setDay({ ...day, summaries: await api.sessionsByDate(day.courtId, day.hallId, day.date) })
    } catch {
      // Keep the counts we have.
    }
  }

  const applyStatus = useCallback((caseId: number, status: CaseStatus) => {
    setSession((prev) =>
      prev && { ...prev, cases: prev.cases.map((c) => (c.caseId === caseId ? { ...c, caseStatus: status } : c)) }
    )
  }, [])

  const changeStatus = async (courtCase: CourtCase, status: CaseStatus) => {
    if (!session) return
    try {
      await api.updateCaseStatus(session.sessionId, courtCase.caseId, status, MODIFIED_BY)
      applyStatus(courtCase.caseId, status)
      toast.success("تم تحديث حالة القضية بنجاح")
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("فشل تحديث الحالة")
    }
  }

  // Changes made from other clerk panels arrive here too.
  const hubState = useSessionHub(session ? [session.sessionId] : [], applyStatus)

  const copyAudienceLink = async () => {
    if (!session) {
      toast.error("لم يتم تحميل الجلسة بعد")
      return
    }
    const url = `${window.location.origin}/hearing-schedule.html?session=${session.sessionId}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success("تم نسخ رابط العرض للجمهور!")
    } catch {
      toast.error("فشل نسخ الرابط", { description: url })
    }
  }

  const backToDashboard = (
    <Button asChild variant="outline">
      <a href="/admin-dashboard.html">
        <ArrowRight />
        العودة للوحة التحكم
      </a>
    </Button>
  )

  return (
    <PageShell fullHeight={phase.name === "board"}>
      {session && <ConnectionStatus state={hubState} />}

      {phase.name === "loading" && <LoadingState />}
      {phase.name === "error" && <ErrorState message={phase.message}>{backToDashboard}</ErrorState>}

      {phase.name === "pick" && day && (
        <>
          <BoardHeader title="لوحة التحكم - أمين السر" showClock={false} actions={backToDashboard} />
          <SessionPicker sessions={day.summaries} onSelect={openSession} showStats />
        </>
      )}

      {phase.name === "board" && session && (
        <>
          <BoardHeader
            title="لوحة التحكم - أمين السر"
            subtitle={[
              session.hearingInfo.courtName,
              session.hearingInfo.courtHall,
              `${session.hearingInfo.hearingDay} | ${session.hearingInfo.hearingDate}`,
              (day?.summaries.length ?? 0) > 1 ? sessionLabel(session) : undefined,
            ]}
            showClock={false}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                {backToDashboard}
                {(day?.summaries.length ?? 0) > 1 && (
                  <Button variant="outline" onClick={showPicker}>
                    <ListOrdered />
                    قائمة الجلسات
                  </Button>
                )}
                <Button onClick={copyAudienceLink}>
                  <Share2 />
                  نسخ رابط العرض للجمهور
                </Button>
              </div>
            }
          />

          <p className="flex items-center gap-2 rounded-xl border border-primary/20 bg-card px-4 py-3 text-sm text-primary sm:text-base">
            <MousePointerClick aria-hidden className="size-5 shrink-0" />
            اضغط على أي قضية في الجدول لتغيير حالتها.
          </p>

          <main className="grid flex-1 gap-6 lg:min-h-0 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <section aria-label="القضية الحالية والتالية" className="flex flex-col gap-6 lg:min-h-0">
              <SpotlightCard
                variant="current"
                courtCase={session.cases.find((c) => c.caseStatus === "in-progress")}
                className="lg:flex-1 lg:justify-center"
              />
              <SpotlightCard variant="next" courtCase={session.cases.find((c) => c.caseStatus === "upcoming-next")} />
            </section>
            <CaseList cases={session.cases} onStatusChange={changeStatus} className="lg:h-full" />
          </main>
        </>
      )}
    </PageShell>
  )
}
