import { CalendarCheck, ChevronLeft, ChevronRight, Clock, ClipboardList, Eye, Filter, Landmark, Loader2, PanelsTopLeft, Trash2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { BoardHeader } from "@/components/court/board-header"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

  // Today's sessions for the side panel, with the same filters, whichever month is shown.
  const [today] = useState(() => {
    const now = new Date()
    return { iso: isoDay(now.getFullYear(), now.getMonth(), now.getDate()), month: `${now.getFullYear()}-${pad(now.getMonth() + 1)}` }
  })
  const [todaySessions, setTodaySessions] = useState<CalendarSession[] | null>(null)

  const loadToday = useCallback(async () => {
    try {
      const list = await api.calendar(
        today.month,
        courtId === ALL ? undefined : Number(courtId),
        hallId === ALL ? undefined : Number(hallId)
      )
      setTodaySessions(list.filter((s) => s.sessionDate.startsWith(today.iso)))
    } catch (error) {
      console.error("Error loading today's sessions:", error)
      setTodaySessions([])
    }
  }, [today, courtId, hallId])

  useEffect(() => {
    void loadToday()
  }, [loadToday])

  const reload = useCallback(() => {
    void loadCalendar()
    void loadToday()
  }, [loadCalendar, loadToday])

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
  const monthCases = sessions.reduce((n, s) => n + (s.casesCount ?? 0), 0)

  return (
    <PageShell>
      <BoardHeader
        title="لوحة التحكم - إدارة الجلسات"
        subtitle={["إنشاء جلسات المحاكم وإدارتها وعرضها"]}
        actions={<CreateSessionDialog courts={courts} onCreated={reload} />}
      />

      <main className="grid items-start gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <section aria-label="جلسات اليوم وملخص الشهر" className="flex flex-col gap-6">
          {/* Today's sessions, styled like the "being heard" card on the board. */}
          <Card className="gap-4 border-gold/20 bg-cream">
            <CardHeader className="flex items-center gap-2.5">
              <CalendarCheck aria-hidden className="size-5 text-gold" />
              <CardTitle className="text-base font-bold text-gold">جلسات اليوم</CardTitle>
              <span className="ms-auto text-sm text-muted-foreground">{longDate.format(new Date(`${today.iso}T00:00:00`))}</span>
            </CardHeader>
            <CardContent>
              {todaySessions === null ? (
                <Loader2 aria-label="جاري التحميل" className="mx-auto my-6 size-6 animate-spin text-muted-foreground" />
              ) : todaySessions.length === 0 ? (
                <p className="py-4 text-lg text-muted-foreground">لا توجد جلسات اليوم</p>
              ) : (
                <ol className="flex flex-col gap-3">
                  {todaySessions.map((s, i) => (
                    <li key={s.sessionId} className="rounded-xl border border-gold/15 bg-card/70 p-4">
                      <div className="flex items-start gap-3">
                        <span className="font-mono text-2xl font-semibold text-gold tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-primary">{sessionLabel(s)}</p>
                          <p className="text-sm text-muted-foreground">
                            {s.courtName} - {s.hallName}
                          </p>
                          <p className="mt-1 flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock aria-hidden className="size-3.5" />
                              {s.sessionTime ? formatTime(s.sessionTime) : "غير محدد"}
                            </span>
                            <span className="flex items-center gap-1">
                              <ClipboardList aria-hidden className="size-3.5" />
                              {s.casesCount} قضية
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button asChild size="sm">
                          <a href={`hearing-schedule.html?court=${s.courtId}&hall=${s.hallId}&date=${today.iso}`}>
                            <Eye />
                            عرض الجلسة
                          </a>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="bg-card">
                          <a href={`clerk-panel.html?session=${s.sessionId}`}>
                            <PanelsTopLeft />
                            لوحة أمين السر
                          </a>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          {/* The month at a glance, styled like the "next case" card. */}
          <Card className="gap-4 border-primary bg-primary text-primary-foreground">
            <CardHeader className="flex items-center gap-2.5">
              <span className="size-2.5 rounded-full bg-primary-foreground/70" />
              <CardTitle className="text-base font-bold text-primary-foreground/80">
                {MONTHS[month.month]} {month.year}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <MonthStat label="الجلسات" value={sessions.length} />
              <MonthStat label="أيام الجلسات" value={byDay.size} />
              <MonthStat label="القضايا" value={monthCases} />
            </CardContent>
          </Card>
        </section>

        {/* The calendar, styled like the board's case table. */}
        <Card className="gap-0 overflow-hidden border-0 py-0">
          <CardHeader className="flex flex-wrap items-center justify-between gap-3 bg-primary py-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => shiftMonth(-1)}
                aria-label="الشهر السابق"
                className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <ChevronRight />
              </Button>
              <h2 className="min-w-36 text-center text-lg font-bold sm:text-xl" aria-live="polite">
                {MONTHS[month.month]} {month.year}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => shiftMonth(1)}
                aria-label="الشهر التالي"
                className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <ChevronLeft />
              </Button>
              {loading && <Loader2 aria-label="جاري التحميل" className="size-5 animate-spin text-primary-foreground/70" />}
            </div>
            <Button variant="secondary" size="sm" onClick={goToToday}>
              اليوم
            </Button>
          </CardHeader>

          <div className="grid gap-4 border-b bg-row-alt px-4 py-4 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] sm:items-end sm:px-6">
            <span className="flex items-center gap-2 text-sm font-bold text-primary sm:pb-2">
              <Filter aria-hidden className="size-4" />
              تصفية
            </span>
            <div className="grid gap-1.5">
              <Label htmlFor="filter-court" className="text-xs text-muted-foreground">
                المحكمة
              </Label>
              <Select value={courtId} onValueChange={chooseCourt}>
                <SelectTrigger id="filter-court" className="w-full bg-card">
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
            <div className="grid gap-1.5">
              <Label htmlFor="filter-hall" className="text-xs text-muted-foreground">
                القاعة
              </Label>
              <Select value={hallId} onValueChange={setHallId} disabled={courtId === ALL}>
                <SelectTrigger id="filter-hall" className="w-full bg-card">
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
          </div>

          <div className="grid grid-cols-7 bg-primary/95 text-center text-xs font-medium text-primary-foreground/85 sm:text-sm">
            {DAYS.map((day) => (
              <div key={day} className="py-2.5">
                <span className="sm:hidden">{day.replace("ال", "").slice(0, 2)}</span>
                <span className="hidden sm:inline">{day}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5 p-2 sm:gap-2 sm:p-4">
            {monthGrid(month.year, month.month).map((cell, i) => {
              const list = cell.date ? (byDay.get(cell.date) ?? []) : []
              const body = (
                <>
                  {cell.isToday && <span aria-hidden className="absolute inset-y-0 start-0 w-1 rounded-s-lg bg-gold" />}
                  <span className="flex items-center justify-between gap-1">
                    <span
                      className={cn(
                        "font-mono text-sm font-semibold tabular-nums sm:text-lg",
                        cell.inMonth ? "text-foreground" : "text-muted-foreground/50",
                        cell.isToday && "text-gold"
                      )}
                    >
                      {cell.day}
                    </span>
                    {cell.isToday && <span className="hidden text-xs font-bold text-gold sm:inline">اليوم</span>}
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
                "relative flex min-h-16 flex-col gap-1 rounded-lg border p-1.5 text-start sm:aspect-[5/4] sm:min-h-0 sm:p-2.5",
                cell.inMonth ? "bg-card" : "border-transparent bg-muted/50",
                cell.isToday && "border-gold/40 bg-cream"
              )
              return list.length > 0 ? (
                <button
                  key={i}
                  type="button"
                  onClick={() => setOpenDay(cell.date!)}
                  aria-label={`${cell.day} ${MONTHS[month.month]}: ${sessionCount(list.length)}`}
                  className={cn(
                    cellClass,
                    "transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
                  )}
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

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t px-4 py-3 text-xs text-muted-foreground sm:px-6">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-primary" /> جلسة واحدة
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-gold" /> أكثر من جلسة
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm border border-gold/40 bg-cream" /> اليوم
            </span>
          </div>
        </Card>
      </main>

      <Dialog open={openDay !== null} onOpenChange={(open) => !open && setOpenDay(null)}>
        <DialogContent className="max-h-[90dvh] gap-0 overflow-hidden p-0 sm:max-w-2xl [&>[data-slot=dialog-close]]:text-primary-foreground" dir="rtl">
          <DialogHeader className="bg-primary px-6 py-5 text-primary-foreground">
            <DialogTitle className="text-xl">الجلسات</DialogTitle>
            <DialogDescription className="text-primary-foreground/75">
              {openDay && longDate.format(new Date(`${openDay}T00:00:00`))}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto p-6">
            {daySessions.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">لا توجد جلسات في هذا التاريخ</p>
            ) : (
              <ol className="grid gap-4">
                {daySessions.map((s, i) => (
                  <SessionCard
                    key={s.sessionId}
                    index={i}
                    session={s}
                    date={openDay!}
                    onDeleted={() => {
                      setOpenDay(null)
                      reload()
                    }}
                  />
                ))}
              </ol>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}

function MonthStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-sm text-primary-foreground/60">{label}</p>
      <p className="font-mono text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function SessionCard({ index, session, date, onDeleted }: { index: number; session: CalendarSession; date: string; onDeleted: () => void }) {
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
    <li className="flex gap-4 rounded-xl border bg-card p-5 even:bg-row-alt">
      <span className="font-mono text-3xl font-semibold text-gold tabular-nums">{String(index + 1).padStart(2, "0")}</span>
      <div className="min-w-0 flex-1">
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
      </div>
    </li>
  )
}
