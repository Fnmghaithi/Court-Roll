import type { ReactNode } from "react"
import { AlertCircle, Loader2 } from "lucide-react"

import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

/** Common page frame: dotted background, gutters and toasts. */
export function PageShell({ children, fullHeight = false, className }: { children: ReactNode; fullHeight?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "relative isolate mx-auto flex min-h-dvh max-w-[120rem] flex-col gap-6 p-4 sm:p-6 lg:p-8",
        fullHeight && "lg:h-dvh",
        className
      )}
    >
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-background bg-dots" />
      {children}
      <Toaster position="top-center" dir="rtl" richColors />
    </div>
  )
}

export function LoadingState({ text = "جاري تحميل الجلسة..." }: { text?: string }) {
  return (
    <div role="status" className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-primary">
      <Loader2 aria-hidden className="size-10 animate-spin" />
      <p className="text-xl font-medium">{text}</p>
    </div>
  )
}

export function ErrorState({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <AlertCircle aria-hidden className="size-14 text-destructive" />
      <p className="max-w-xl text-xl font-medium">{message}</p>
      {children}
    </div>
  )
}
