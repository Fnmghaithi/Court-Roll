/*
 * Client for the ASP.NET backend. Endpoints, payloads and field names match
 * the original admin-dashboard / clerk-panel / hearing-schedule pages exactly.
 */
import type { CaseStatus } from "./case-status"

const API = "/api"

export interface Court {
  courtId: number
  courtName: string
}

export interface Hall {
  hallId: number
  hallName: string
}

export interface Panel {
  customPanelId: number
  panelName: string
}

export interface HearingInfo {
  courtName: string
  courtHall: string
  /** dd/mm/yyyy */
  hearingDate: string
  hearingDay: string
  judges?: string[]
  clerks?: string[]
}

export interface CourtCase {
  caseId: number
  rowNumber: number
  /** As stored, e.g. "210/7103/2024" (number/court/year); shown reversed. */
  caseNumber: string
  publicProsecutionNumber?: string | null
  plaintiff: string
  defendant: string
  caseStatus: CaseStatus
}

/** One entry of the month calendar. */
export interface CalendarSession {
  sessionId: number
  courtId: number
  hallId: number
  courtName: string
  hallName: string
  /** ISO date, possibly with a time part. */
  sessionDate: string
  sessionTime?: string | null
  sessionTitle?: string | null
  sessionOrder: number
  casesCount: number
}

/** A session as listed for a court, hall and date (without its cases). */
export interface SessionSummary {
  sessionId: number
  courtId?: number
  hallId?: number
  sessionTitle?: string | null
  sessionOrder: number
  sessionTime?: string | null
  totalCases: number
  discussedCases: number
  rulingIssuedCases: number
  inProgressCases: number
  hearingInfo: HearingInfo
}

/** A full session with its cases. */
export interface SessionDetail {
  sessionId: number
  courtId: number
  hallId: number
  courtName?: string
  hallName?: string
  sessionTitle?: string | null
  sessionOrder?: number
  sessionTime?: string | null
  hearingInfo: HearingInfo
  cases: CourtCase[]
}

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** Extracts a readable message from an error response, as the original pages did. */
async function errorFrom(res: Response) {
  const text = await res.text()
  try {
    const json = JSON.parse(text) as { message?: string; title?: string }
    return new ApiError(res.status, json.message || json.title || text || `HTTP ${res.status}`)
  } catch {
    return new ApiError(res.status, text || `HTTP ${res.status}`)
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, init)
  if (!res.ok) throw await errorFrom(res)
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

export const api = {
  courts: () => request<Court[]>("/session/courts"),
  halls: (courtId: number) => request<Hall[]>(`/session/courts/${courtId}/halls`),
  panels: (courtId: number) => request<Panel[]>(`/session/courts/${courtId}/panels`),

  calendar: (month: string, courtId?: number, hallId?: number) => {
    const q = new URLSearchParams({ month })
    if (courtId) q.set("courtId", String(courtId))
    if (hallId) q.set("hallId", String(hallId))
    return request<CalendarSession[]>(`/session/calendar?${q}`)
  },

  sessionsByDate: (courtId: number | string, hallId: number | string, date: string) =>
    request<SessionSummary[]>(`/session/sessions?courtId=${courtId}&hallId=${hallId}&date=${date}`),

  session: (sessionId: number | string) => request<SessionDetail>(`/session/sessions/${sessionId}`),

  deleteSession: (sessionId: number) => request<unknown>(`/session/sessions/${sessionId}`, { method: "DELETE" }),

  updateCaseStatus: (sessionId: number, caseId: number, status: CaseStatus, modifiedBy: string) =>
    request<unknown>(`/session/sessions/${sessionId}/cases/${caseId}/status`, json("PUT", { status, modifiedBy })),

  createSession: (data: {
    courtId: number
    hallId: number
    sessionDate: string
    sessionTime: string | null
    sessionOrder: number
    sessionTitle: string | null
    hearingInfo: HearingInfo
    cases: []
  }) => request<unknown>("/session/sessions", json("POST", data)),

  createInvestmentSession: (data: {
    courtId: number
    hallId: number
    customPanelId: number
    sessionDate: string
    sessionTime: string | null
    langId: number
  }) => request<unknown>("/session/investment/sessions", json("POST", data)),

  uploadAndCreateSession: (form: FormData) =>
    request<{ extractedCases?: number }>("/document/upload-and-create-session", { method: "POST", body: form }),
}

/** "210/7103/2024" → "2024/7103/210", as displayed in the original pages. */
export function reverseCaseNumber(caseNumber?: string | null) {
  return caseNumber ? caseNumber.split("/").reverse().join("/") : ""
}

/** "09:30:00" → "09:30". */
export function formatTime(time?: string | null) {
  if (!time) return ""
  const [h, m] = time.split(":")
  return `${h}:${m}`
}

/** hearingInfo.hearingDate "dd/mm/yyyy" → "yyyy-mm-dd". */
export function hearingDateToIso(date: string) {
  const parts = date.split("/")
  if (parts.length !== 3) return date
  const [d, m, y] = parts
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
}

export function sessionLabel(s: { sessionTitle?: string | null; sessionOrder?: number }) {
  return s.sessionTitle || `الجلسة ${s.sessionOrder ?? ""}`.trim()
}
