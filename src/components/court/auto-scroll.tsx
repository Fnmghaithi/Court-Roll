import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { cn } from "@/lib/utils"

interface AutoScrollProps {
  children: ReactNode
  /** Scroll speed in pixels per second. */
  speed?: number
  /** When false, the content stays still and scrolls by hand instead. */
  enabled?: boolean
  /**
   * Called after each full pass of the loop, or every `dwellMs` when the
   * content fits and doesn't move.
   */
  onCycle?: () => void
  dwellMs?: number
  /** How long the list stays where it was scrolled by hand before moving again. */
  resumeMs?: number
  className?: string
}

/**
 * Continuously scrolls its content upward in a seamless loop, but only when the
 * content is taller than the space available. Short lists stay still.
 * Scrolling by hand (wheel, touch, scrollbar) pauses the loop; it carries on from
 * the same place after `resumeMs` without input.
 */
export function AutoScroll({
  children,
  speed = 32,
  enabled = true,
  onCycle,
  dwellMs = 30_000,
  resumeMs = 8_000,
  className,
}: AutoScrollProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [overflowing, setOverflowing] = useState(false)
  const [duration, setDuration] = useState(0)
  const [manual, setManual] = useState(false)
  // Negative animation delay, so the loop resumes where the hand scrolling stopped.
  const [startDelay, setStartDelay] = useState(0)
  const pendingScrollTop = useRef<number | null>(null)
  const resumeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
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

  const looping = enabled && overflowing && !reducedMotion
  const animate = looping && !manual
  const cycle = useRef(onCycle)
  useLayoutEffect(() => {
    cycle.current = onCycle
  })

  // When nothing scrolls, still report a "pass" now and then.
  useEffect(() => {
    if (!enabled || animate || !onCycle) return
    const id = setInterval(() => cycle.current?.(), dwellMs)
    return () => clearInterval(id)
  }, [enabled, animate, dwellMs, onCycle])

  useEffect(() => () => clearTimeout(resumeTimer.current), [])

  // Height of one copy of the list (the track holds two).
  const loopHeight = () => (trackRef.current?.offsetHeight ?? 0) / 2

  const scheduleResume = () => {
    clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => {
      const viewport = viewportRef.current
      const height = loopHeight()
      if (!viewport || height <= 0) return
      const offset = viewport.scrollTop % height
      setStartDelay(duration > 0 ? -(offset / height) * duration : 0)
      pendingScrollTop.current = 0
      setManual(false)
    }, resumeMs)
  }

  // Switch from the moving list to a scrollable one at the same position.
  const takeOver = (extra = 0) => {
    if (!looping) return
    if (!manual) {
      const track = trackRef.current
      const shift = track ? new DOMMatrixReadOnly(getComputedStyle(track).transform).m42 : 0
      // The wheel turn that starts hand scrolling also moves the list.
      pendingScrollTop.current = Math.max(0, -shift + extra)
      setManual(true)
    }
    scheduleResume()
  }

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (viewport && pendingScrollTop.current !== null) {
      viewport.scrollTop = pendingScrollTop.current
      pendingScrollTop.current = null
    }
  }, [manual])

  // While scrolling by hand, wrap around so the list never runs out.
  const onScroll = () => {
    if (!manual) return
    const viewport = viewportRef.current
    const height = loopHeight()
    if (viewport && height > 0 && viewport.scrollTop >= height) viewport.scrollTop -= height
    scheduleResume()
  }

  return (
    <div
      ref={viewportRef}
      onWheel={(e) => takeOver(manual ? 0 : e.deltaY)}
      onTouchStart={() => takeOver()}
      onPointerDown={() => takeOver()}
      onScroll={onScroll}
      className={cn(
        "relative min-h-0 overscroll-contain",
        animate ? "overflow-hidden" : "overflow-y-auto",
        looping && "[mask-image:linear-gradient(to_bottom,transparent,black_4%,black_92%,transparent)]",
        className
      )}
    >
      <div
        ref={trackRef}
        className={cn(animate && "animate-marquee-y hover:[animation-play-state:paused]")}
        onAnimationIteration={() => cycle.current?.()}
        style={{ "--marquee-duration": `${duration}s`, animationDelay: `${startDelay}s` } as CSSProperties}
      >
        <div ref={contentRef} className={cn(looping && "pb-8")}>
          {children}
        </div>
        {looping && (
          <div aria-hidden inert className="pb-8">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
