import { HubConnectionBuilder, HubConnectionState, LogLevel, type HubConnection } from "@microsoft/signalr"
import { useEffect, useEffectEvent, useRef, useState } from "react"

import type { CaseStatus } from "@/lib/case-status"

export type HubState = "connecting" | "connected" | "reconnecting" | "disconnected"

const HUB_URL = "/sessionHub"

/**
 * Connects to the backend's SignalR hub, joins every session in `sessionIds`
 * (all of a day's sessions, so a change in any of them arrives), and calls
 * `onStatusChanged` for each CaseStatusChanged event. Rejoins after reconnecting.
 */
export function useSessionHub(
  sessionIds: number[],
  onStatusChanged: (caseId: number, status: CaseStatus, modifiedBy: string) => void
) {
  const [state, setState] = useState<HubState>("connecting")
  const onEvent = useEffectEvent(onStatusChanged)

  const connectionRef = useRef<HubConnection | null>(null)
  const joined = useRef(new Set<number>())
  const wanted = useRef<number[]>([])
  const key = [...new Set(sessionIds)].sort((a, b) => a - b).join(",")

  // One connection for the page's lifetime.
  useEffect(() => {
    const joinedIds = joined.current
    const connection = new HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()
    connectionRef.current = connection

    connection.on("CaseStatusChanged", (caseId: number, status: CaseStatus, modifiedBy: string) =>
      onEvent(Number(caseId), status, modifiedBy)
    )
    connection.onreconnecting(() => setState("reconnecting"))
    connection.onreconnected(async () => {
      setState("connected")
      joinedIds.clear()
      await joinAll(connection, wanted.current, joinedIds)
    })
    connection.onclose(() => setState("disconnected"))

    let cancelled = false
    // Started on the next tick, so React's development double-mount doesn't
    // open a connection only to abort it mid-negotiation.
    const timer = setTimeout(() => {
      connection
        .start()
        .then(async () => {
          if (cancelled) return
          setState("connected")
          await joinAll(connection, wanted.current, joinedIds)
        })
        .catch(() => !cancelled && setState("disconnected"))
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(timer)
      void connection.stop()
      connectionRef.current = null
      joinedIds.clear()
    }
  }, [])

  // Join sessions as they become known.
  useEffect(() => {
    wanted.current = key ? key.split(",").map(Number) : []
    const connection = connectionRef.current
    if (connection?.state === HubConnectionState.Connected) void joinAll(connection, wanted.current, joined.current)
  }, [key])

  return state
}

async function joinAll(connection: HubConnection, ids: number[], joined: Set<number>) {
  for (const id of ids) {
    if (joined.has(id)) continue
    try {
      await connection.invoke("JoinSession", id)
      joined.add(id)
    } catch (error) {
      console.error(`Failed to join session ${id}`, error)
    }
  }
}
