import { Settings2 } from "lucide-react"

import { BoardHeader } from "@/components/court/board-header"
import { CaseList } from "@/components/court/case-list"
import { SpotlightCard } from "@/components/court/spotlight-card"
import { Card } from "@/components/ui/card"
import { useAdminMode } from "@/hooks/use-admin-mode"
import { useCourtCases } from "@/hooks/use-court-cases"

export default function App() {
  const { cases, current, next, waitingCount, updateStatus } = useCourtCases()
  const isAdmin = useAdminMode()

  return (
    <div className="relative isolate mx-auto flex min-h-dvh max-w-[120rem] flex-col gap-6 p-4 sm:p-6 lg:h-dvh lg:p-8">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-background bg-dots" />
      <BoardHeader />

      {isAdmin && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-primary/20 bg-card px-4 py-3 text-sm text-primary sm:text-base"
        >
          <Settings2 aria-hidden className="size-5 shrink-0" />
          <p>
            <span className="font-bold">وضع الإدارة</span>
            <span className="mx-2 text-primary/40" aria-hidden>
              |
            </span>
            اضغط على أي قضية في الجدول لتغيير حالتها.
          </p>
        </div>
      )}

      <main className="grid flex-1 gap-6 lg:min-h-0 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section aria-label="القضية الحالية والتالية" className="flex flex-col gap-6 lg:min-h-0">
          <SpotlightCard variant="current" courtCase={current} className="lg:flex-1 lg:justify-center" />
          <SpotlightCard variant="next" courtCase={next} />

          <div className="grid grid-cols-2 gap-6">
            <Stat label="قضايا اليوم" value={cases.length} />
            <Stat label="في الانتظار" value={waitingCount} />
          </div>
        </section>

        <CaseList
          cases={cases}
          nextId={next?.id}
          onStatusChange={isAdmin ? updateStatus : undefined}
          className="lg:h-full"
        />
      </main>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="gap-1 px-6 py-5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono text-3xl font-semibold text-primary tabular-nums">{value}</span>
    </Card>
  )
}
