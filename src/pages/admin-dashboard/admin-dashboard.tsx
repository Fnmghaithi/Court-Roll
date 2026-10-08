import { CalendarDays, ChevronLeft, ChevronRight, Clock, ClipboardList, Eye, Landmark, Loader2, PanelsTopLeft, Trash2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { PageShell } from "@/components/court/page-shell"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api, formatTime, sessionLabel, type CalendarSession, type Court, type Hall } from "@/lib/api"
import { cn } from "@/lib/utils"

import { CreateSessionDialog } from "./create-session-dialog"

const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
const ALL = "all"

const pad = (n: number) => String(n).padStart(2, "0")
const isoDay = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

function sessionCount(n: number) {
  if (n === 1) return "جلسة واحدة"
  if (n === 2) return "جلستان"
  if (n <= 10) return `${n} جلسات`
  return `${n} جلسة`
}

interface Cell {
  day: number
  date?: string
  inMonth: boolean
  isToday: boolean
}

/** The six-week grid for a month, starting on Sunday, as in the original calendar. */
function monthGrid(year: number, month: number): Cell[] {
  const first = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()
  const today = new Date()
  const cells: Cell[] = []
  for (let i = first - 1; i >= 0; i--) cells.push({ day: prevDays - i, inMonth: false, isToday: false })
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      date: isoDay(year, month, d),
      inMonth: true,
      isToday: d === today.getDate() && month === today.getMonth() && year === today.getFullYear(),
    })
  }
  for (let d = 1; cells.length < 42; d++) cells.push({ day: d, inMonth: false, isToday: false })
  return cells
}

const longDate = new Intl.DateTimeFormat("ar-OM", { weekday: "long", day: "numeric", month: "long", year: "numeric", numberingSystem: "latn" })

export function AdminDashboard() {
  const [courts, setCourts] = useState<Court[]>([])
  const [halls, setHalls] = useState<Hall[]>([])
  const [courtId, setCourtId] = useState(ALL)
  const [hallId, setHallId] = useState(ALL)
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  // The calendar shown, and which month/filters it was fetched for.
  const [calendar, setCalendar] = useState<{ key: string; sessions: CalendarSession[] }>({ key: "", sessions: [] })
  const sessions = calendar.sessions
  const [openDay, setOpenDay] = useState<string | null>(null)

  useEffect(() => {
    api.courts().then(setCourts).catch((error) => {
      console.error("Error loading courts:", error)
      toast.error("تعذّر تحميل قائمة المحاكم")
    })
  }, [])

  const calendarKey = `${month.year}-${pad(month.month + 1)}|${courtId}|${hallId}`
  const loading = calendar.key !== calendarKey

  const loadCalendar = useCallback(async () => {
    const key = `${month.year}-${pad(month.month + 1)}|${courtId}|${hallId}`
    try {
      const list = await api.calendar(
        `${month.year}-${pad(month.month + 1)}`,
        courtId === ALL ? undefined : Number(courtId),
        hallId === ALL ? undefined : Number(hallId)
      )
      setCalendar({ key, sessions: list })
    } catch (error) {
      console.error("Error loading calendar:", error)
      toast.error("تعذّر تحميل الجلسات")
      setCalendar({ key, sessions: [] })
    }
  }, [month, courtId, hallId])

  useEffect(() => {
    void loadCalendar()
  }, [loadCalendar])

  const chooseCourt = async (value: string) => {
    setCourtId(value)
    setHallId(ALL)
    setHalls([])
    if (value !== ALL) {
      try {
        setHalls(await api.halls(Number(value)))
      } catch (error) {
        console.error("Error loading halls:", error)
      }
    }
  }

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarSession[]>()
    for (const s of sessions) {
      const key = s.sessionDate.slice(0, 10)
      map.set(key, [...(map.get(key) ?? []), s])
    }
    return map
  }, [sessions])

  const shiftMonth = (delta: number) =>
    setMonth(({ year, month: m }) => {
      const d = new Date(year, m + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })

  const goToToday = () => {
    const now = new Date()
    setMonth({ year: now.getFullYear(), month: now.getMonth() })
  }

  const daySessions = openDay ? (byDay.get(openDay) ?? []) : []

  return (
    <PageShell className="max-w-[90rem]">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground sm:size-12">
            <CalendarDays className="size-5 sm:size-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold sm:text-2xl">لوحة التحكم - إدارة الجلسات</h1>
            <p className="text-sm text-muted-foreground sm:text-base">إنشاء جلسات المحاكم وإدارتها وعرضها</p>
          </div>
        </div>
        <CreateSessionDialog courts={courts} onCreated={loadCalendar} />
      </header>

      <Card className="grid gap-5 px-6 py-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="filter-court" className="text-primary">
            المحكمة
          </Label>
          <Select value={courtId} onValueChange={chooseCourt}>
            <SelectTrigger id="filter-court" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>جميع المحاكم</SelectItem>
              {courts.map((c) => (
                <SelectItem key={c.courtId} value={String(c.courtId)}>
                  {c.courtName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="filter-hall" className="text-primary">
            القاعة
          </Label>
          <Select value={hallId} onValueChange={setHallId} disabled={courtId === ALL}>
            <SelectTrigger id="filter-hall" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>جميع القاعات</SelectItem>
              {halls.map((h) => (
                <SelectItem key={h.hallId} value={String(h.hallId)}>
                  {h.hallName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="gap-5 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)} aria-label="الشهر السابق">
              <ChevronRight />
            </Button>
            <h2 className="min-w-40 text-center text-xl font-bold text-primary sm:text-2xl" aria-live="polite">
              {MONTHS[month.month]} {month.year}
            </h2>
            <Button variant="outline" size="icon" onClick={() => shiftMonth(1)} aria-label="الشهر التالي">
              <ChevronLeft />
            </Button>
            {loading && <Loader2 aria-label="جاري التحميل" className="size-5 animate-spin text-muted-foreground" />}
          </div>
          <Button variant="secondary" onClick={goToToday}>
            اليوم
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
          {DAYS.map((day) => (
            <div key={day} className="rounded-md bg-muted py-2 text-center text-xs font-bold text-primary sm:text-sm">
              <span className="sm:hidden">{day.replace("ال", "").slice(0, 2)}</span>
              <span className="hidden sm:inline">{day}</span>
            </div>
          ))}
          {monthGrid(month.year, month.month).map((cell, i) => {
            const list = cell.date ? (byDay.get(cell.date) ?? []) : []
            const body = (
              <>
                <span className={cn("font-mono text-sm font-semibold tabular-nums sm:text-lg", cell.isToday && "text-live")}>
                  {cell.day}
                </span>
                {list.length > 0 && (
                  <span
                    className={cn(
                      "mt-auto truncate rounded-md px-1.5 py-1 text-center text-[0.65rem] font-medium sm:text-xs",
                      list.length > 1 ? "bg-gold text-primary-foreground" : "bg-primary text-primary-foreground"
                    )}
                  >
                    <span className="sm:hidden">{list.length}</span>
                    <span className="hidden sm:inline">{sessionCount(list.length)}</span>
                  </span>
                )}
              </>
            )
            const cellClass = cn(
              "flex min-h-16 flex-col gap-1 rounded-lg border bg-card p-1.5 text-start sm:aspect-[5/4] sm:min-h-0 sm:p-2.5",
              !cell.inMonth && "border-transparent bg-muted/40 text-muted-foreground/60",
              cell.isToday && "border-2 border-live"
            )
            return list.length > 0 ? (
              <button
                key={i}
                type="button"
                onClick={() => setOpenDay(cell.date!)}
                aria-label={`${cell.day} ${MONTHS[month.month]}: ${sessionCount(list.length)}`}
                className={cn(cellClass, "transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary")}
              >
                {body}
              </button>
            ) : (
              <div key={i} className={cellClass}>
                {body}
              </div>
            )
          })}
        </div>
      </Card>

      <Dialog open={openDay !== null} onOpenChange={(open) => !open && setOpenDay(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl text-primary">الجلسات</DialogTitle>
            <DialogDescription>{openDay && longDate.format(new Date(`${openDay}T00:00:00`))}</DialogDescription>
          </DialogHeader>
          {daySessions.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">لا توجد جلسات في هذا التاريخ</p>
          ) : (
            <ul className="grid gap-4">
              {daySessions.map((s) => (
                <SessionCard
                  key={s.sessionId}
                  session={s}
                  date={openDay!}
                  onDeleted={() => {
                    setOpenDay(null)
                    void loadCalendar()
                  }}
                />
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}

function SessionCard({ session, date, onDeleted }: { session: CalendarSession; date: string; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false)

  const remove = async () => {
    setDeleting(true)
    try {
      await api.deleteSession(session.sessionId)
      toast.success("تم حذف الجلسة بنجاح")
      onDeleted()
    } catch (error) {
      console.error("Error deleting session:", error)
      toast.error("فشل حذف الجلسة")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <li className="rounded-xl border p-5">
      <h3 className="text-lg font-bold text-primary">{sessionLabel(session)}</h3>
      <dl className="mt-2 grid gap-1 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Landmark aria-hidden className="size-4" />
          <dt className="sr-only">المكان</dt>
          <dd>
            {session.courtName} - {session.hallName}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <Clock aria-hidden className="size-4" />
          <dt>الوقت:</dt>
          <dd>{session.sessionTime ? formatTime(session.sessionTime) : "غير محدد"}</dd>
        </div>
        <div className="flex items-center gap-2">
          <ClipboardList aria-hidden className="size-4" />
          <dt>عدد القضايا:</dt>
          <dd>{session.casesCount}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild size="sm">
          <a href={`hearing-schedule.html?court=${session.courtId}&hall=${session.hallId}&date=${date}`}>
            <Eye />
            عرض الجلسة
          </a>
        </Button>
        <Button asChild size="sm" variant="outline">
          <a href={`clerk-panel.html?session=${session.sessionId}`}>
            <PanelsTopLeft />
            لوحة أمين السر
          </a>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={deleting}>
              {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
              حذف
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>حذف «{sessionLabel(session)}»؟</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف الجلسة وجميع القضايا المرتبطة بها ({session.casesCount}). لا يمكن التراجع عن ذلك.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={remove} className="bg-destructive text-white hover:bg-destructive/90">
                حذف الجلسة
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  )
}
