import { useCallback, useEffect, useMemo, useState } from "react"

import {
  fetchTodaysCases,
  setCaseStatus,
  STATUS_STORAGE_KEY,
  type CaseStatus,
  type CourtCase,
} from "@/data/cases"

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

    // Pick up changes made in another tab (e.g. an admin tab on the same machine).
    const onStorage = (event: StorageEvent) => {
      if (event.key === STATUS_STORAGE_KEY) load()
    }

    load()
    const id = setInterval(load, REFRESH_MS)
    window.addEventListener("storage", onStorage)
    return () => {
      cancelled = true
      clearInterval(id)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  const updateStatus = useCallback((id: string, status: CaseStatus) => {
    setCaseStatus(id, status)
      .then(setCases)
      .catch(() => {
        // Leave the list as it was if the change could not be saved.
      })
  }, [])

  return useMemo(() => {
    const currentIndex = cases.findIndex((c) => c.status === "in_review")
    const current = currentIndex >= 0 ? cases[currentIndex] : undefined
    // An admin can pick the next case. Otherwise it is the first waiting case
    // after the one being heard (or the first waiting case of the day).
    const next =
      cases.find((c) => c.status === "next") ??
      cases.find((c, i) => c.status === "waiting" && i > currentIndex)
    const waitingCount = cases.filter((c) => c.status === "waiting" || c.status === "next").length

    return { cases, current, next, waitingCount, updateStatus }
  }, [cases, updateStatus])
}
