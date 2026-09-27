import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion, useInView } from '../lib/motion'

/**
 * A figure that rattles through digits and settles left to right, like a
 * departure board finding its line. Runs when it first scrolls into view and
 * again, faster, whenever the value changes.
 */
export default function Ticker({ value, className = '' }: { value: string; className?: string }) {
  const [ref, inView] = useInView<HTMLSpanElement>()
  const [display, setDisplay] = useState(value)
  const ran = useRef(false)

  useEffect(() => {
    if (!inView) return
    if (prefersReducedMotion()) {
      setDisplay(value)
      return
    }
    const duration = ran.current ? 520 : 1100
    ran.current = true
    const chars = value.split('')
    const digits = chars.filter((c) => /\d/.test(c)).length || 1
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = (now - start) / duration
      let seen = 0
      const out = chars
        .map((c) => {
          if (!/\d/.test(c)) return c
          seen++
          // Each digit locks in at its own moment, leftmost first.
          return t >= 0.25 + (seen / digits) * 0.75 ? c : String(Math.floor(Math.random() * 10))
        })
        .join('')
      setDisplay(out)
      if (t < 1) raf = requestAnimationFrame(tick)
      else setDisplay(value)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, inView])

  return (
    <span ref={ref} className={className}>
      {/* The settled value is what screen readers and printouts get. */}
      <span className="ticker-value sr-only">{value}</span>
      <span className="ticker-live" aria-hidden>
        {display}
      </span>
    </span>
  )
}
