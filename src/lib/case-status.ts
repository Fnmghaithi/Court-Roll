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

/** Investment courts are recognised by name, as in the original dashboard. */
export function isInvestmentCourtName(name?: string | null) {
  return !!name && name.includes("الاستثمار")
}

/**
 * Labels from the roll's own table headers, falling back to the defaults.
 * Investment courts always keep the defaults, whatever the session carries.
 */
export function getPartyLabels(
  info?: { courtName?: string | null; plaintiffLabel?: string | null; defendantLabel?: string | null },
  courtName = info?.courtName
): PartyLabels {
  if (isInvestmentCourtName(courtName)) return PARTY_LABELS
  return {
    plaintiff: info?.plaintiffLabel?.trim() || PARTY_LABELS.plaintiff,
    defendant: info?.defendantLabel?.trim() || PARTY_LABELS.defendant,
  }
}

export function isFinished(status: CaseStatus) {
  return status === "discussed" || status === "ruling-issued"
}
