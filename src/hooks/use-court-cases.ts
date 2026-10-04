import { useEffect, useMemo, useState } from "react"

import { fetchTodaysCases, type CourtCase } from "@/data/cases"

const REFRESH_MS = 30_000

/**
 * Loads today's cases and keeps them fresh, so a board left running on a TV
 * picks up status changes without anyone touching it.
 */
export function useCourtCases() {
  const [cases, setCases] = useState<CourtCase[]>([])

  useEffect(() => {
    let cancelled = false
    const load = () =>
      fetchTodaysCases()
        .then((data) => {
          if (!cancelled) setCases(data)
        })
        .catch(() => {
          // Keep showing the last good list if a refresh fails.
        })

    load()
    const id = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return useMemo(() => {
    const currentIndex = cases.findIndex((c) => c.status === "in_review")
    const current = currentIndex >= 0 ? cases[currentIndex] : undefined
    // "Up next" is the first waiting case after the one being heard
    // (or the first waiting case of the day if nothing is in session yet).
    const next = cases.find(
      (c, i) => c.status === "waiting" && i > currentIndex
    )
    const waitingCount = cases.filter((c) => c.status === "waiting").length

    return { cases, current, next, waitingCount }
  }, [cases])
}
