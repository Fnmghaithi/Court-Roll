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

const EN_ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"]
const EN_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]

function englishBelowHundred(n: number) {
  if (n < 20) return EN_ONES[n]
  const ones = n % 10
  return ones ? `${EN_TENS[Math.floor(n / 10)]}-${EN_ONES[ones]}` : EN_TENS[Math.floor(n / 10)]
}

function englishBelowThousand(n: number) {
  const hundreds = Math.floor(n / 100)
  const rest = englishBelowHundred(n % 100)
  if (!hundreds) return rest
  return rest ? `${EN_ONES[hundreds]} hundred and ${rest}` : `${EN_ONES[hundreds]} hundred`
}

/** Spells out a whole number below 10,000 in English (e.g. 2024 → "two thousand and twenty-four"). */
export function numberToEnglishWords(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n >= 10_000) return String(n)
  if (n === 0) return "zero"
  const thousands = Math.floor(n / 1000)
  const rest = n % 1000
  if (!thousands) return englishBelowThousand(rest)
  const head = `${EN_ONES[thousands]} thousand`
  if (!rest) return head
  return rest < 100 ? `${head} and ${englishBelowHundred(rest)}` : `${head} ${englishBelowThousand(rest)}`
}

function parseCaseNumber(caseNumber: string) {
  const parts = caseNumber.split("/").map((p) => Number.parseInt(p, 10))
  const [number, , year] = parts
  return parts.length === 3 && Number.isFinite(number) && Number.isFinite(year) ? { number, year } : null
}

/** Spoken form of a case number like "210/7103/2024": "رقم مئتين وعشرة لسنة ألفين وأربعة وعشرين". */
export function speakableCaseNumber(caseNumber: string) {
  const parsed = parseCaseNumber(caseNumber)
  return parsed
    ? `رقم ${numberToArabicWords(parsed.number)} لسنة ${numberToArabicWords(parsed.year)}`
    : `رقم ${caseNumber}`
}

/** A piece of an announcement and the language the voice should read it in. */
export interface SpeechSegment {
  text: string
  lang: AnnouncementLanguage
}

export type AnnouncementLanguage = "ar" | "en"

export const ANNOUNCEMENT_LANGUAGES: { value: AnnouncementLanguage; label: string }[] = [
  { value: "ar", label: "العربية" },
  { value: "en", label: "English" },
]

/**
 * What is announced in the hall when a case is called. Party names are always
 * read in Arabic, since they are written in Arabic; in English the surrounding
 * words are read in English.
 */
export function buildAnnouncement(courtCase: CourtCase, lang: AnnouncementLanguage = "ar"): SpeechSegment[] {
  const plaintiff = speakableParties(courtCase.plaintiff)
  const defendant = speakableParties(courtCase.defendant)

  if (lang === "en") {
    const parsed = parseCaseNumber(courtCase.caseNumber)
    const number = parsed
      ? `${numberToEnglishWords(parsed.number)}, of ${numberToEnglishWords(parsed.year)}`
      : courtCase.caseNumber
    return [
      { lang: "en", text: `Now being heard: case number ${number}. The appellant:` },
      { lang: "ar", text: `${plaintiff}.` },
      { lang: "en", text: "The appellee:" },
      { lang: "ar", text: `${defendant}.` },
    ]
  }

  return [
    {
      lang: "ar",
      text: [
        `تُنظر الآن الدعوى ${speakableCaseNumber(courtCase.caseNumber)}.`,
        `المستأنف: ${plaintiff}.`,
        `المستأنف ضده: ${defendant}.`,
      ].join(" "),
    },
  ]
}

/** A short sentence for checking the voice settings. */
export function testAnnouncement(lang: AnnouncementLanguage): SpeechSegment[] {
  return lang === "en"
    ? [{ lang: "en", text: "This is a test of the courtroom announcement system." }]
    : [{ lang: "ar", text: "هذا اختبار لنظام النداء الصوتي في قاعة المحكمة." }]
}
