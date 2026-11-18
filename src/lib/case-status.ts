/** Case statuses as stored by the backend. */
export type CaseStatus = "in-review" | "upcoming-next" | "in-progress" | "discussed" | "ruling-issued"

/** The order the clerk's menu lists them in, as in the original clerk panel. */
export const CASE_STATUSES: CaseStatus[] = ["in-review", "upcoming-next", "in-progress", "discussed", "ruling-issued"]

/** Labels used by the original pages, kept so clerks and the public see the same words. */
export const STATUS_LABELS: Record<CaseStatus, string> = {
  "in-review": "في الإنتظار",
  "upcoming-next": "الجلسة القادمة",
  "in-progress": "تنظر الآن",
  discussed: "تمت المناقشة",
  "ruling-issued": "تم الحكم",
}

/** Column and card labels for the parties, as in the original pages (any kind of court). */
export const PARTY_LABELS = { plaintiff: "المدعي / المستأنف", defendant: "المدعى عليه / المستأنف عليه" }

export type PartyLabels = typeof PARTY_LABELS

/** Labels from the roll's own table headers, falling back to the defaults (e.g. investment courts). */
export function getPartyLabels(info?: { plaintiffLabel?: string | null; defendantLabel?: string | null }): PartyLabels {
  return {
    plaintiff: info?.plaintiffLabel?.trim() || PARTY_LABELS.plaintiff,
    defendant: info?.defendantLabel?.trim() || PARTY_LABELS.defendant,
  }
}

export function isFinished(status: CaseStatus) {
  return status === "discussed" || status === "ruling-issued"
}
