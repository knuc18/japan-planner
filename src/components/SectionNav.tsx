import { useState } from 'react'
import { useScrollFrame } from '../lib/motion'

const STOPS = [
  { id: 'fig-route', n: '01', label: 'Route' },
  { id: 'fig-days', n: '02', label: 'Days' },
  { id: 'fig-transit', n: '03', label: 'Transit' },
  { id: 'fig-cost', n: '04', label: 'Cost' },
]

/**
 * A line map of the results page itself, pinned in the left margin on wide
 * screens: four stations, with "you are here" lit as you read.
 */
export default function SectionNav() {
  const [active, setActive] = useState<string | null>(null)
  const [shown, setShown] = useState(false)

  // Scroll position rather than an observer band: short sections can slip
  // through a thin band without ever intersecting it.
  useScrollFrame(() => {
    const results = document.getElementById('results')
    if (!results) return
    const line = window.innerHeight * 0.4
    const r = results.getBoundingClientRect()
    setShown(r.top < window.innerHeight * 0.6 && r.bottom > window.innerHeight * 0.4)
    let current: string | null = null
    for (const s of STOPS) {
      const el = document.getElementById(s.id)
      if (el && el.getBoundingClientRect().top <= line) current = s.id
    }
    setActive(current)
  })

  const index = STOPS.findIndex((s) => s.id === active)

  return (
    <nav
      aria-label="Results sections"
      className={`no-print fixed left-6 top-1/2 z-40 hidden -translate-y-1/2 transition-[opacity,transform] duration-500 xl:block ${
        shown ? 'opacity-100' : 'pointer-events-none -translate-x-3 opacity-0'
      }`}
    >
      <ol className="relative">
        <span aria-hidden className="absolute bottom-3 left-[7px] top-3 w-[2px] bg-rule" />
        <span
          aria-hidden
          className="absolute left-[7px] top-3 w-[2px] origin-top bg-sun transition-[height] duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]"
          style={{ height: index <= 0 ? 0 : `calc((100% - 1.5rem) * ${index / (STOPS.length - 1)})` }}
        />
        {STOPS.map((s, i) => {
          const on = s.id === active
          const passed = i <= index
          return (
            <li key={s.id} className="relative py-2.5">
              <a
                href={`#${s.id}`}
                aria-current={on ? 'location' : undefined}
                className="group flex items-center gap-3"
              >
                <span
                  className={`relative z-10 block h-4 w-4 rounded-full border-2 transition-all duration-300 ${
                    passed ? 'border-sun bg-sun' : 'border-rule bg-paper group-hover:border-ink'
                  } ${on ? 'scale-125' : ''}`}
                />
                <span
                  className={`tnum text-[10px] uppercase tracking-[0.2em] transition-colors ${
                    on ? 'text-ink' : 'text-ink-soft group-hover:text-ink'
                  }`}
                >
                  {s.n} {s.label}
                </span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
