import { useSyncExternalStore } from "react"

const ADMIN_HASH = "#admin"

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange)
  return () => window.removeEventListener("hashchange", onChange)
}

/**
 * Admin mode is turned on by opening the page with `#admin` at the end of the
 * address. This only switches the interface; it is not access control.
 */
export function useAdminMode() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.hash === ADMIN_HASH,
    () => false
  )
}
