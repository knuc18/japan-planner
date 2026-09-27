import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react'

const REDUCE = '(prefers-reduced-motion: reduce)'

export function prefersReducedMotion(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia(REDUCE).matches
}

function subscribeReduced(cb: () => void) {
  const mq = matchMedia(REDUCE)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduced, prefersReducedMotion, () => false)
}

/**
 * True once the element has scrolled into view. The trigger line sits a little
 * above the bottom of the viewport so things settle while you're looking at
 * them, and a margin (not a ratio) keeps very tall blocks from never firing.
 */
export function useInView<T extends Element>(rootMargin = '0px 0px -12% 0px') {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin])

  return [ref, inView] as const
}

/**
 * Calls `update` at most once per frame whenever the page scrolls or resizes,
 * or when `observe` changes size, plus once on mount. For scroll-linked
 * visuals that write styles directly instead of re-rendering React.
 */
export function useScrollFrame(update: () => void, observe?: RefObject<Element | null>) {
  const latest = useRef(update)
  latest.current = update

  useEffect(() => {
    let raf = 0
    const schedule = () => {
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0
          latest.current()
        })
    }
    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    const ro = observe?.current ? new ResizeObserver(schedule) : null
    if (ro && observe?.current) ro.observe(observe.current)
    return () => {
      cancelAnimationFrame(raf)
      ro?.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [observe])
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
