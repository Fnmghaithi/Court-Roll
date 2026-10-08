import { FileUp, Loader2, Plus } from "lucide-react"
import { useRef, useState, type FormEvent } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api, ApiError, type Court, type Hall, type Panel } from "@/lib/api"
import { cn } from "@/lib/utils"

const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
const TIMES = ["08:00", "08:15", "08:30", "08:45", "09:00", "09:15", "09:30", "09:45", "10:00", "10:15", "10:30", "10:45", "11:00"]
const ORDERS = ["الجلسة الأولى", "الجلسة الثانية", "الجلسة الثالثة", "الجلسة الرابعة", "الجلسة الخامسة"]
const NO_TIME = "none"

/** Investment courts are recognised by name, as in the original dashboard. */
function isInvestmentCourtName(name?: string) {
  return !!name && name.includes("الاستثمار")
}

interface FormState {
  courtId: string
  panelId: string
  hallId: string
  date: string
  time: string
  order: string
  title: string
  file: File | null
}

const EMPTY: FormState = { courtId: "", panelId: "", hallId: "", date: "", time: NO_TIME, order: "1", title: "", file: null }

export function CreateSessionDialog({ courts, onCreated }: { courts: Court[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [halls, setHalls] = useState<Hall[]>([])
  const [panels, setPanels] = useState<Panel[]>([])
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [saving, setSaving] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const court = courts.find((c) => String(c.courtId) === form.courtId)
  const investment = isInvestmentCourtName(court?.courtName)
  const set = (patch: Partial<FormState>) => {
    setForm((f) => ({ ...f, ...patch }))
    // Clear the message for any field just filled in.
    setErrors((e) => {
      const next = { ...e }
      for (const key of Object.keys(patch) as (keyof FormState)[]) delete next[key]
      return next
    })
  }

  const reset = () => {
    setForm(EMPTY)
    setHalls([])
    setPanels([])
    setErrors({})
    setSaving(false)
  }

  const chooseCourt = async (courtId: string) => {
    set({ courtId, hallId: "", panelId: "" })
    setHalls([])
    setPanels([])
    const chosen = courts.find((c) => String(c.courtId) === courtId)
    try {
      setHalls(await api.halls(Number(courtId)))
    } catch (error) {
      console.error("Error loading halls:", error)
    }
    if (isInvestmentCourtName(chosen?.courtName)) {
      try {
        setPanels(await api.panels(Number(courtId)))
      } catch (error) {
        console.error("Error loading panels:", error)
      }
    }
  }

  const validate = () => {
    const e: typeof errors = {}
    if (!form.courtId) e.courtId = "اختر المحكمة"
    if (investment && !form.panelId) e.panelId = "الرجاء اختيار الدائرة"
    if (!form.hallId) e.hallId = "اختر القاعة"
    if (!form.date) e.date = "اختر التاريخ"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    const courtId = Number(form.courtId)
    const hallId = Number(form.hallId)
    const time = form.time === NO_TIME ? "" : form.time
    const [y, m, d] = form.date.split("-")

    setSaving(true)
    try {
      if (investment) {
        // Investment court: no Word file; the cases come from the selected panel's daily roll.
        try {
          await api.createInvestmentSession({
            courtId,
            hallId,
            customPanelId: Number(form.panelId),
            sessionDate: form.date,
            sessionTime: time ? `${time}:00` : null,
            langId: 1,
          })
          toast.success("تم إنشاء جلسة المحكمة الاستثمارية بنجاح")
        } catch (error) {
          if (error instanceof ApiError && error.status === 404) {
            toast.error("فشل إنشاء الجلسة: لا توجد قضايا لهذه الدائرة في هذا التاريخ")
            return
          }
          throw error
        }
      } else if (form.file) {
        const data = new FormData()
        data.append("file", form.file)
        data.append("courtId", String(courtId))
        data.append("hallId", String(hallId))
        data.append("sessionDate", form.date)
        data.append("sessionTime", time)
        data.append("sessionOrder", form.order)
        data.append("sessionTitle", form.title)
        try {
          const result = await api.uploadAndCreateSession(data)
          toast.success("تم إنشاء الجلسة بنجاح!", { description: `عدد القضايا: ${result?.extractedCases ?? 0}` })
        } catch (error) {
          toast.error(`فشل إنشاء الجلسة من الملف: ${error instanceof Error ? error.message : error}`)
          return
        }
      } else {
        await api.createSession({
          courtId,
          hallId,
          sessionDate: form.date,
          sessionTime: time || null,
          sessionOrder: Number(form.order),
          sessionTitle: form.title || null,
          hearingInfo: {
            courtName: court?.courtName ?? "",
            courtHall: halls.find((h) => h.hallId === hallId)?.hallName ?? "",
            hearingDate: `${d}/${m}/${y}`,
            hearingDay: DAY_NAMES[new Date(Number(y), Number(m) - 1, Number(d)).getDay()],
            judges: [],
            clerks: [],
          },
          cases: [],
        })
        toast.success("تم إنشاء الجلسة بنجاح")
      }
      setOpen(false)
      reset()
      onCreated()
    } catch (error) {
      console.error("Error creating session:", error)
      toast.error(`فشل إنشاء الجلسة: ${error instanceof Error ? error.message : "خطأ غير معروف"}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (saving) return
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg">
          <Plus />
          إنشاء جلسة جديدة
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary">إنشاء جلسة جديدة</DialogTitle>
          <DialogDescription>الحقول المعلّمة بـ * مطلوبة.</DialogDescription>
        </DialogHeader>

        <form id="create-session" onSubmit={submit} className="grid gap-5" noValidate>
          <Field label="المحكمة *" id="create-court" error={errors.courtId}>
            <Select value={form.courtId} onValueChange={chooseCourt}>
              <SelectTrigger id="create-court" className="w-full" aria-invalid={!!errors.courtId}>
                <SelectValue placeholder="اختر المحكمة" />
              </SelectTrigger>
              <SelectContent>
                {courts.map((c) => (
                  <SelectItem key={c.courtId} value={String(c.courtId)}>
                    {c.courtName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {investment && (
            <Field
              label={
                <>
                  الدائرة *
                  <Badge variant="outline" className="border-primary/25 text-primary">
                    محكمة استثمارية
                  </Badge>
                </>
              }
              id="create-panel"
              error={errors.panelId}
            >
              <Select value={form.panelId} onValueChange={(panelId) => set({ panelId })}>
                <SelectTrigger id="create-panel" className="w-full" aria-invalid={!!errors.panelId}>
                  <SelectValue placeholder="اختر الدائرة" />
                </SelectTrigger>
                <SelectContent>
                  {panels.map((p) => (
                    <SelectItem key={p.customPanelId} value={String(p.customPanelId)}>
                      {p.panelName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field label="القاعة *" id="create-hall" error={errors.hallId}>
            <Select value={form.hallId} onValueChange={(hallId) => set({ hallId })} disabled={!form.courtId}>
              <SelectTrigger id="create-hall" className="w-full" aria-invalid={!!errors.hallId}>
                <SelectValue placeholder="اختر القاعة" />
              </SelectTrigger>
              <SelectContent>
                {halls.map((h) => (
                  <SelectItem key={h.hallId} value={String(h.hallId)}>
                    {h.hallName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="التاريخ *" id="create-date" error={errors.date}>
              <Input
                id="create-date"
                type="date"
                value={form.date}
                onChange={(e) => set({ date: e.target.value })}
                aria-invalid={!!errors.date}
                className="justify-end"
              />
            </Field>
            <Field label="الوقت" id="create-time">
              <Select value={form.time} onValueChange={(time) => set({ time })}>
                <SelectTrigger id="create-time" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TIME}>اختياري</SelectItem>
                  {TIMES.map((t) => (
                    <SelectItem key={t} value={t}>
                      <span dir="ltr">{t}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {!investment && (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="ترتيب الجلسة *" id="create-order">
                  <Select value={form.order} onValueChange={(order) => set({ order })}>
                    <SelectTrigger id="create-order" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDERS.map((label, i) => (
                        <SelectItem key={label} value={String(i + 1)}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="عنوان الجلسة" id="create-title">
                  <Input
                    id="create-title"
                    value={form.title}
                    onChange={(e) => set({ title: e.target.value })}
                    placeholder="مثال: الجلسة الصباحية"
                  />
                </Field>
              </div>

              <Field label="رفع مستند Word (اختياري)" id="create-file">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const file = e.dataTransfer.files[0]
                    if (file) set({ file })
                  }}
                  className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-input px-4 py-6 text-muted-foreground transition-colors hover:border-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <FileUp aria-hidden className="size-8 text-primary" />
                  <span>انقر لرفع ملف Word، أو اسحبه إلى هنا</span>
                  {form.file && <span className="font-bold text-live">{form.file.name}</span>}
                </button>
                <input
                  ref={fileInput}
                  id="create-file"
                  type="file"
                  accept=".doc,.docx"
                  className="hidden"
                  onChange={(e) => set({ file: e.target.files?.[0] ?? null })}
                />
              </Field>
            </>
          )}
        </form>

        <DialogFooter className="items-center gap-3">
          {saving && (
            <span role="status" className="flex items-center gap-2 text-sm font-medium text-primary sm:me-auto">
              <Loader2 aria-hidden className="size-4 animate-spin" />
              جاري إنشاء الجلسة...
            </span>
          )}
          <Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button type="submit" form="create-session" disabled={saving}>
            إنشاء الجلسة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, id, error, children }: { label: React.ReactNode; id: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-primary">
        {label}
      </Label>
      {children}
      {error && <p className={cn("text-sm text-destructive")}>{error}</p>}
    </div>
  )
}
