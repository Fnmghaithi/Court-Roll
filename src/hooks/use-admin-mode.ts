import { useCallback, useEffect, useState } from "react"

const ADMIN_HASH = "#admin"

function hashIsAdmin() {
  try {
    return window.location.hash === ADMIN_HASH
  } catch {
    return false
  }
}

/**
 * Admin mode turns on from the header's settings button, or by opening the
 * page with `#admin` at the end of the address. Some embedded viewers drop the
 * hash, so the button is the dependable way in. This only switches the
 * interface; it is not access control.
 */
export function useAdminMode() {
  const [isAdmin, setIsAdmin] = useState(hashIsAdmin)

  useEffect(() => {
    const onHashChange = () => setIsAdmin(hashIsAdmin())
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  const toggleAdmin = useCallback(() => {
    setIsAdmin((value) => {
      const next = !value
      try {
        // Keep the address in step so a reload stays in the same mode.
        history.replaceState(null, "", next ? ADMIN_HASH : window.location.pathname + window.location.search)
      } catch {
        // Sandboxed frames can refuse history changes; the toggle still works.
      }
      return next
    })
  }, [])

  return { isAdmin, toggleAdmin }
}
