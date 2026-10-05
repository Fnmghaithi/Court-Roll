import type { CaseStatus } from "@/data/cases"

export const STATUS_LABELS: Record<CaseStatus, string> = {
  in_review: "تنظر الآن",
  next: "القضية التالية",
  waiting: "في الانتظار",
  discussed: "تمت المناقشة",
  judged: "تم الحكم",
}
