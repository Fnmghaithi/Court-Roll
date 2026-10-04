export type CaseStatus = "in_review" | "waiting"

export interface CourtCase {
  id: string
  caseNumber: string
  plaintiff: string
  defendant: string
  status: CaseStatus
}

/**
 * Today's cause list, in hearing order.
 * Dummy data — replace `fetchTodaysCases` with a real API call later.
 */
const TODAYS_CASES: CourtCase[] = [
  { id: "1", caseNumber: "CV-2026-01482", plaintiff: "Northwind Logistics LLC", defendant: "Harbor Freight Partners", status: "in_review" },
  { id: "2", caseNumber: "CV-2026-01519", plaintiff: "Amelia Rahman", defendant: "Crescent Property Group", status: "waiting" },
  { id: "3", caseNumber: "CR-2026-00377", plaintiff: "The State", defendant: "Daniel K. Osei", status: "waiting" },
  { id: "4", caseNumber: "FM-2026-00912", plaintiff: "Laila Haddad", defendant: "Omar Haddad", status: "waiting" },
  { id: "5", caseNumber: "CV-2026-01544", plaintiff: "Bluefin Software Inc.", defendant: "Meridian Analytics Ltd.", status: "waiting" },
  { id: "6", caseNumber: "CM-2026-00261", plaintiff: "Gulf Coast Bank", defendant: "Sami Trading Est.", status: "waiting" },
  { id: "7", caseNumber: "CV-2026-01561", plaintiff: "Priya Natarajan", defendant: "City Transit Authority", status: "waiting" },
  { id: "8", caseNumber: "LB-2026-00438", plaintiff: "Yusuf Al-Amin", defendant: "Atlas Construction Co.", status: "waiting" },
  { id: "9", caseNumber: "CR-2026-00402", plaintiff: "The State", defendant: "Marcus Bell", status: "waiting" },
  { id: "10", caseNumber: "CV-2026-01577", plaintiff: "Evergreen Health Clinic", defendant: "MedSupply Distributors", status: "waiting" },
  { id: "11", caseNumber: "FM-2026-00948", plaintiff: "Nora Al-Sayed", defendant: "Khalid Al-Sayed", status: "waiting" },
  { id: "12", caseNumber: "CM-2026-00289", plaintiff: "Sunrise Foods Co.", defendant: "Delta Packaging Ltd.", status: "waiting" },
  { id: "13", caseNumber: "CV-2026-01603", plaintiff: "Hannah Fischer", defendant: "Lakeside Apartments HOA", status: "waiting" },
  { id: "14", caseNumber: "LB-2026-00455", plaintiff: "Fatima Zahra Idrissi", defendant: "Oasis Hospitality Group", status: "waiting" },
  { id: "15", caseNumber: "CV-2026-01618", plaintiff: "Pioneer Auto Rentals", defendant: "Rashid Mansour", status: "waiting" },
  { id: "16", caseNumber: "CR-2026-00419", plaintiff: "The State", defendant: "Elena Petrova", status: "waiting" },
]

export async function fetchTodaysCases(): Promise<CourtCase[]> {
  return TODAYS_CASES
}
