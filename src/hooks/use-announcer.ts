import { useSyncExternalStore } from "react"

import { getAnnouncerSnapshot, subscribeAnnouncer } from "@/lib/tts/announcer"

export function useAnnouncer() {
  return useSyncExternalStore(subscribeAnnouncer, getAnnouncerSnapshot, getAnnouncerSnapshot)
}
