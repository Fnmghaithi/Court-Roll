import type { CourtCase } from "@/data/cases"

const ONES = ["", "واحد", "اثنين", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"]
const TEENS = ["عشرة", "أحد عشر", "اثني عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"]
const TENS = ["", "", "عشرين", "ثلاثين", "أربعين", "خمسين", "ستين", "سبعين", "ثمانين", "تسعين"]
const HUNDREDS = ["", "مئة", "مئتين", "ثلاثمئة", "أربعمئة", "خمسمئة", "ستمئة", "سبعمئة", "ثمانمئة", "تسعمئة"]

function belowHundred(n: number) {
  if (n < 10) return ONES[n]
  if (n < 20) return TEENS[n - 10]
  const ones = n % 10
  const tens = TENS[Math.floor(n / 10)]
  return ones ? `${ONES[ones]} و${tens}` : tens
}

function belowThousand(n: number) {
  const parts = [HUNDREDS[Math.floor(n / 100)], belowHundred(n % 100)].filter(Boolean)
  return parts.join(" و")
}

/**
 * Spells out a whole number as spoken Arabic, in the form used after "رقم" and
 * "لسنة" (e.g. 2024 → "ألفين وأربعة وعشرين"). Numbers of 10,000 and above, which
 * don't occur in case numbers, are left as digits.
 */
export function numberToArabicWords(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n >= 10_000) return String(n)
  if (n === 0) return "صفر"
  const thousands = Math.floor(n / 1000)
  const rest = n % 1000
  const head =
    thousands === 0 ? "" : thousands === 1 ? "ألف" : thousands === 2 ? "ألفين" : `${ONES[thousands]} آلاف`
  return [head, belowThousand(rest)].filter(Boolean).join(" و")
}

/**
 * Prepares a party name for speech: drops company-form abbreviations such as
 * "ش م م" or "ش.ش.و" (which would be read letter by letter), list numbering
 * like "2/", and joins several parties with "و".
 */
export function speakableParties(names: string) {
  const spoken = names
    .replace(/\d+\s*\/\s*(?=\S)/g, "")
    .replace(/\./g, " ")
    .replace(/\(\s*ش(?:\s+[مشعبو]){1,3}\s*\)/g, " ")
    .replace(/(^|\s)ش(?:\s+[مشعبو]){1,3}(?=\s|$|-)/g, " ")
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return spoken
    .split(/\s+-\s+|\s*-\s*$|^\s*-\s*/)
    .map((p) => p.trim())
    .filter(Boolean)
    .join("، و")
}

/** Spoken form of a case number like "210/7103/2024": "رقم مئتين وعشرة لسنة ألفين وأربعة وعشرين". */
export function speakableCaseNumber(caseNumber: string) {
  const parts = caseNumber.split("/").map((p) => Number.parseInt(p, 10))
  const [number, , year] = parts
  if (parts.length === 3 && Number.isFinite(number) && Number.isFinite(year)) {
    return `رقم ${numberToArabicWords(number)} لسنة ${numberToArabicWords(year)}`
  }
  return `رقم ${caseNumber}`
}

/** The sentence announced in the hall when a case is called. */
export function buildAnnouncement(courtCase: CourtCase) {
  return [
    `تُنظر الآن الدعوى ${speakableCaseNumber(courtCase.caseNumber)}.`,
    `المستأنف: ${speakableParties(courtCase.plaintiff)}.`,
    `المستأنف ضده: ${speakableParties(courtCase.defendant)}.`,
  ].join(" ")
}
