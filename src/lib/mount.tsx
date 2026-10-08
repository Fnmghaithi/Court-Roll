import { StrictMode, type ReactNode } from "react"
import { createRoot } from "react-dom/client"
import { Direction } from "radix-ui"

import "@/index.css"

/** Renders a page into #root, right to left for every component. */
export function mountPage(page: ReactNode) {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Direction.Provider dir="rtl">{page}</Direction.Provider>
    </StrictMode>
  )
}
