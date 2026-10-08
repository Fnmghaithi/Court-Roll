import { api, hearingDateToIso, type SessionDetail, type SessionSummary } from "./api"

/** What a page was opened with: a session id, or a court, hall and date. */
export type PageTarget = { sessionId: number } | { courtId: string; hallId: string; date: string } | null

export function readPageTarget(search = window.location.search): PageTarget {
  const params = new URLSearchParams(search)
  const session = params.get("session")
  if (session) return { sessionId: Number(session) }
  const courtId = params.get("court")
  const hallId = params.get("hall")
  const date = params.get("date")
  if (courtId && hallId && date) return { courtId, hallId, date }
  return null
}

/** Puts ?session=<id> in the address bar without reloading, as the original pages did. */
export function showSessionInUrl(sessionId: number) {
  window.history.pushState({ sessionId }, "", `${window.location.pathname}?session=${sessionId}`)
}

export function showDayInUrl(courtId: number | string, hallId: number | string, date: string) {
  window.history.pushState({}, "", `${window.location.pathname}?court=${courtId}&hall=${hallId}&date=${date}`)
}

export interface DaySessions {
  courtId: number | string
  hallId: number | string
  date: string
  summaries: SessionSummary[]
}

/** The day's sessions in the same court and hall as `detail`. */
export async function siblingsOf(detail: SessionDetail): Promise<DaySessions> {
  const date = hearingDateToIso(detail.hearingInfo.hearingDate)
  let summaries: SessionSummary[] = []
  try {
    summaries = await api.sessionsByDate(detail.courtId, detail.hallId, date)
  } catch (error) {
    console.error("Could not load the day's other sessions", error)
  }
  if (!summaries.some((s) => s.sessionId === detail.sessionId)) {
    summaries = [summaryFromDetail(detail), ...summaries]
  }
  return { courtId: detail.courtId, hallId: detail.hallId, date, summaries }
}

export function summaryFromDetail(detail: SessionDetail): SessionSummary {
  const count = (status: string) => detail.cases.filter((c) => c.caseStatus === status).length
  return {
    sessionId: detail.sessionId,
    courtId: detail.courtId,
    hallId: detail.hallId,
    sessionTitle: detail.sessionTitle,
    sessionOrder: detail.sessionOrder ?? 1,
    sessionTime: detail.sessionTime,
    totalCases: detail.cases.length,
    discussedCases: count("discussed"),
    rulingIssuedCases: count("ruling-issued"),
    inProgressCases: count("in-progress"),
    hearingInfo: detail.hearingInfo,
  }
}
