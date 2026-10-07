import { AudioLines, Loader2, Play, RefreshCw, Repeat, Settings2, SlidersHorizontal, Volume2, VolumeX } from "lucide-react"

import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import type { CourtCase } from "@/data/cases"
import { useAnnouncer } from "@/hooks/use-announcer"
import { ANNOUNCEMENT_LANGUAGES, CALL_MODES, type AnnouncementLanguage, type CallMode } from "@/lib/tts/announcement"
import {
  announceCase,
  announceTest,
  QUALITY_PRESETS,
  retryAnnouncer,
  setAnnouncementsEnabled,
  SPEED_RANGE,
  updateVoiceSettings,
  VOICES,
  type AnnouncerStatus,
  type Voice,
} from "@/lib/tts/announcer"
import { cn } from "@/lib/utils"

function statusText(status: AnnouncerStatus) {
  switch (status.state) {
    case "idle":
      return "يُحمَّل عند أول استخدام"
    case "loading":
      return `جارٍ تحميل نموذج الصوت ${status.file}/${status.files} (${Math.round(status.fraction * 100)}٪)`
    case "ready":
      return status.backend === "webgpu" ? "جاهز (بطاقة الرسوميات)" : "جاهز (المعالج)"
    case "speaking":
      return "جارٍ النداء…"
    case "error":
      return "تعذّر تحميل نموذج الصوت"
  }
}

function voiceLabel(voice: Voice) {
  return `${voice.startsWith("M") ? "صوت رجالي" : "صوت نسائي"} ${voice.slice(1)}`
}

const buttonClass =
  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50"

export function AdminBanner({ currentCase }: { currentCase?: CourtCase }) {
  const { enabled, status } = useAnnouncer()
  const busy = status.state === "loading" || status.state === "speaking"

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-card px-4 py-3 text-sm sm:text-base">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex items-center gap-3 text-primary">
          <Settings2 aria-hidden className="size-5 shrink-0" />
          <p>
            <span className="font-bold">وضع الإدارة</span>
            <span className="mx-2 text-primary/40" aria-hidden>
              |
            </span>
            اضغط على أي قضية في الجدول لتغيير حالتها.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
          {enabled && (
            <span
              role="status"
              className={cn("me-2 flex items-center gap-1.5", status.state === "error" && "text-destructive")}
            >
              {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <AudioLines aria-hidden className="size-4" />}
              النداء الصوتي: {statusText(status)}
            </span>
          )}

          {enabled && status.state === "error" && (
            <button type="button" onClick={retryAnnouncer} className={cn(buttonClass, "border-destructive/30 text-destructive hover:bg-destructive/5")}>
              <RefreshCw aria-hidden className="size-4" />
              إعادة المحاولة
            </button>
          )}

          {enabled && (
            <>
              <button
                type="button"
                onClick={() => currentCase && announceCase(currentCase)}
                disabled={!currentCase}
                className={cn(buttonClass, "border-primary/25 text-primary hover:bg-primary/5")}
              >
                <Repeat aria-hidden className="size-4" />
                إعادة النداء
              </button>
              <VoiceSettingsPopover />
            </>
          )}

          <button
            type="button"
            onClick={() => setAnnouncementsEnabled(!enabled)}
            aria-pressed={enabled}
            className={cn(
              buttonClass,
              enabled ? "border-border text-muted-foreground hover:bg-muted" : "border-primary/25 text-primary hover:bg-primary/5"
            )}
          >
            {enabled ? <VolumeX aria-hidden className="size-4" /> : <Volume2 aria-hidden className="size-4" />}
            {enabled ? "إيقاف النداء الصوتي" : "تشغيل النداء الصوتي"}
          </button>
        </div>
      </div>

      {enabled && status.state === "error" && (
        <p className="text-sm text-destructive">
          {status.message}. يحتاج النموذج إلى الاتصال بالإنترنت عند أول تحميل، أو إلى نسخة محلية من ملفاته (انظر ملف README).
        </p>
      )}
    </div>
  )
}

function VoiceSettingsPopover() {
  const { settings } = useAnnouncer()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={cn(buttonClass, "border-primary/25 text-primary hover:bg-primary/5")}>
          <SlidersHorizontal aria-hidden className="size-4" />
          إعدادات الصوت
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80" dir="rtl">
        <div className="flex flex-col gap-5">
          <h2 className="font-bold">إعدادات النداء الصوتي</h2>

          <div className="grid gap-2">
            <Label htmlFor="voice-mode">طريقة النداء</Label>
            <Select dir="rtl" value={settings.mode} onValueChange={(value) => updateVoiceSettings({ mode: value as CallMode })}>
              <SelectTrigger id="voice-mode" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CALL_MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="voice-lang">اللغة</Label>
            <Select
              dir="rtl"
              value={settings.lang}
              onValueChange={(value) => updateVoiceSettings({ lang: value as AnnouncementLanguage })}
            >
              <SelectTrigger id="voice-lang" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANNOUNCEMENT_LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="voice-voice">الصوت</Label>
            <Select dir="rtl" value={settings.voice} onValueChange={(value) => updateVoiceSettings({ voice: value as Voice })}>
              <SelectTrigger id="voice-voice" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {voiceLabel(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="voice-speed">السرعة</Label>
              <span className="font-mono text-sm text-muted-foreground tabular-nums">
                <span dir="ltr">{settings.speed.toFixed(2)}×</span>
              </span>
            </div>
            <Slider
              id="voice-speed"
              dir="rtl"
              min={SPEED_RANGE.min}
              max={SPEED_RANGE.max}
              step={SPEED_RANGE.step}
              value={[settings.speed]}
              onValueChange={([speed]) => updateVoiceSettings({ speed })}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>أبطأ</span>
              <span>أسرع</span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="voice-quality">الجودة</Label>
            <Select
              dir="rtl"
              value={String(settings.steps)}
              onValueChange={(value) => updateVoiceSettings({ steps: Number(value) })}
            >
              <SelectTrigger id="voice-quality" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUALITY_PRESETS.map((q) => (
                  <SelectItem key={q.steps} value={String(q.steps)}>
                    {q.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">الجودة الأعلى أوضح لكنها تستغرق وقتاً أطول قبل بدء النداء.</p>
          </div>

          <button
            type="button"
            onClick={announceTest}
            className={cn(buttonClass, "justify-center border-primary bg-primary text-primary-foreground hover:bg-primary/90")}
          >
            <Play aria-hidden className="size-4" />
            تجربة الصوت
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
