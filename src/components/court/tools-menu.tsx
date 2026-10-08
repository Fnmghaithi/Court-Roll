import { House, ListOrdered, Settings, SlidersHorizontal } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

import { VoiceSettings } from "./voice-settings"

const itemClass =
  "flex w-full items-center gap-3 px-4 py-3 text-start text-sm font-medium text-primary transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"

/**
 * Hidden tools for the hearing schedule (أدوات), as in the original page: the
 * tab slides down when the mouse reaches the top corner, so the TV shows nothing.
 */
export function ToolsMenu({ onShowSessions }: { onShowSessions?: () => void }) {
  return (
    <div className="group fixed top-0 start-0 z-50 h-20 w-64">
      <div className="absolute start-5 -top-12 w-56 transition-[top] duration-300 group-focus-within:top-0 group-hover:top-0">
        <div className="flex items-center gap-2 rounded-b-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-md">
          <Settings aria-hidden className="size-4" />
          أدوات
        </div>
        <div
          className={cn(
            "grid overflow-hidden rounded-b-xl bg-card shadow-lg transition-all duration-300",
            "max-h-0 opacity-0 group-focus-within:max-h-80 group-focus-within:opacity-100 group-hover:max-h-80 group-hover:opacity-100"
          )}
        >
          <a href="/admin-dashboard.html" className={itemClass}>
            <House aria-hidden className="size-4" />
            لوحة التحكم
          </a>
          {onShowSessions && (
            <button type="button" onClick={onShowSessions} className={itemClass}>
              <ListOrdered aria-hidden className="size-4" />
              قائمة الجلسات
            </button>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className={itemClass}>
                <SlidersHorizontal aria-hidden className="size-4" />
                إعدادات الصوت
              </button>
            </PopoverTrigger>
            <PopoverContent side="left" align="start" className="w-80">
              <VoiceSettings />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}
