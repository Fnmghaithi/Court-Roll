import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { cn } from "@/lib/utils"

interface AutoScrollProps {
  children: ReactNode
  /** Scroll speed in pixels per second. */
  speed?: number
  /** When false, the content stays still and scrolls by hand instead. */
  enabled?: boolean
  className?: string
}

/**
 * Continuously scrolls its content upward in a seamless loop, but only when the
 * content is taller than the space available. Short lists stay still.
 */
export function AutoScroll({ children, speed = 32, enabled = true, className }: AutoScrollProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [overflowing, setOverflowing] = useState(false)
  const [duration, setDuration] = useState(0)
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return

    const measure = () => {
      const height = content.offsetHeight
      setOverflowing(height > viewport.clientHeight + 1)
      setDuration(height / speed)
    }

    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(content)
    measure()
    return () => observer.disconnect()
  }, [speed])

  const animate = enabled && overflowing && !reducedMotion

  return (
    <div
      ref={viewportRef}
      className={cn(
        "relative min-h-0",
        animate
          ? "overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_4%,black_92%,transparent)]"
          : "overflow-y-auto",
        className
      )}
    >
      <div
        className={cn(animate && "animate-marquee-y hover:[animation-play-state:paused]")}
        style={{ "--marquee-duration": `${duration}s` } as CSSProperties}
      >
        <div ref={contentRef} className={cn(animate && "pb-8")}>
          {children}
        </div>
        {animate && (
          <div aria-hidden inert className="pb-8">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
