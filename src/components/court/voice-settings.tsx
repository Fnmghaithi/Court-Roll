import { Loader2, Play, RefreshCw, Volume2, VolumeX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useAnnouncer } from "@/hooks/use-announcer"
import {
  ANNOUNCEMENT_LANGUAGES,
  CALL_MODES,
  WORDINGS,
  type AnnouncementLanguage,
  type CallMode,
  type Wording,
} from "@/lib/tts/announcement"
import {
  announceTest,
  QUALITY_PRESETS,
  retryAnnouncer,
  setAnnouncementsEnabled,
  SPEED_RANGE,
  TTS_ENGINE,
  updateVoiceSettings,
  VOICES,
  type AnnouncerStatus,
  type Voice,
} from "@/lib/tts/announcer"
import { cn } from "@/lib/utils"

function announcerStatusText(status: AnnouncerStatus) {
  switch (status.state) {
    case "idle":
      return "جاهز عند الحاجة"
    case "loading":
      return `جارٍ تحميل نموذج الصوت ${status.file}/${status.files} (${Math.round(status.fraction * 100)}٪)`
    case "ready":
      return `جاهز · ${status.detail}`
    case "speaking":
      return "جارٍ النداء…"
    case "blocked":
      return "المتصفح أوقف الصوت"
    case "error":
      return status.message
  }
}

function voiceLabel(voice: Voice) {
  return `${voice.startsWith("M") ? "صوت رجالي" : "صوت نسائي"} ${voice.slice(1)}`
}

/** Settings for the hall announcements, shown from the hearing schedule's tools menu. */
export function VoiceSettings() {
  const { enabled, settings, status } = useAnnouncer()
  const supertonic = TTS_ENGINE === "supertonic"
  const busy = status.state === "loading" || status.state === "speaking"

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">النداء الصوتي</h2>
          <p className="text-xs text-muted-foreground">
            المحرك: {supertonic ? <bdi>Supertonic 3</bdi> : <>صوت المتصفح (<bdi>Microsoft Naayf</bdi>)</>}
          </p>
        </div>
        <Button
          variant={enabled ? "outline" : "default"}
          size="sm"
          onClick={() => setAnnouncementsEnabled(!enabled)}
          aria-pressed={enabled}
        >
          {enabled ? <VolumeX /> : <Volume2 />}
          {enabled ? "إيقاف" : "تشغيل"}
        </Button>
      </div>

      <p
        role="status"
        className={cn(
          "flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm",
          status.state === "error" && "bg-destructive/10 text-destructive"
        )}
      >
        {busy && <Loader2 aria-hidden className="size-4 shrink-0 animate-spin" />}
        {announcerStatusText(status)}
      </p>
      {status.state === "error" && (
        <Button variant="outline" size="sm" onClick={retryAnnouncer}>
          <RefreshCw />
          إعادة المحاولة
        </Button>
      )}

      <div className="grid gap-2">
        <Label htmlFor="voice-wording">صيغة النداء</Label>
        <Select value={settings.wording} onValueChange={(value) => updateVoiceSettings({ wording: value as Wording })}>
          <SelectTrigger id="voice-wording" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WORDINGS.map((w) => (
              <SelectItem key={w.value} value={w.value}>
                {w.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {settings.wording === "classic"
            ? "«القضية رقم …، على …، على …، تُنْظَرُ الْآنَ»"
            : "«تُنْظَرُ الآنَ الدَّعْوَى رَقْم … لِسَنَة …» مع التشكيل"}
        </p>
      </div>

      {settings.wording === "tashkeel" && (
        <div className="grid gap-2">
          <Label htmlFor="voice-mode">طريقة النداء</Label>
          <Select value={settings.mode} onValueChange={(value) => updateVoiceSettings({ mode: value as CallMode })}>
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
      )}

      {supertonic && (
        <>
          {settings.wording === "tashkeel" && (
            <div className="grid gap-2">
              <Label htmlFor="voice-lang">اللغة</Label>
              <Select value={settings.lang} onValueChange={(value) => updateVoiceSettings({ lang: value as AnnouncementLanguage })}>
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
          )}

          <div className="grid gap-2">
            <Label htmlFor="voice-voice">الصوت</Label>
            <Select value={settings.voice} onValueChange={(value) => updateVoiceSettings({ voice: value as Voice })}>
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
            <Select value={String(settings.steps)} onValueChange={(value) => updateVoiceSettings({ steps: Number(value) })}>
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
          </div>
        </>
      )}

      <Button onClick={announceTest}>
        <Play />
        تجربة الصوت
      </Button>
    </div>
  )
}
