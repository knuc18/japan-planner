import { Fragment, useRef, type CSSProperties } from 'react'
import type { Itinerary } from '../lib/itinerary'
import type { Leg, Mode } from '../data/transport'
import { REGION_META } from '../data/regions'
import { clamp, prefersReducedMotion, useScrollFrame } from '../lib/motion'
import Reveal from './Reveal'

const MODE_LABEL: Record<string, string> = {
  shinkansen: 'Shinkansen',
  'limited-express': 'Limited Express',
  'highway-bus': 'Highway Bus',
  flight: 'Flight',
  ferry: 'Ferry',
  'rental-car': 'Rental Car',
}

/** Small line-drawn glyph per mode, sized to sit in running text. */
function ModeIcon({ mode }: { mode: Mode }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  switch (mode) {
    case 'flight':
      return (
        <svg {...common}>
          <path d="M2 9.5 L14 5.5 C 14.8 5.2, 15 6.2, 14.3 6.6 L 3.5 12 L 1.8 10.4 Z M6 8.2 L 4.5 3.5 L 6 3 L 9.5 7" />
        </svg>
      )
    case 'ferry':
      return (
        <svg {...common}>
          <path d="M2 10 H14 L12.5 13 H3.5 Z M4.5 10 V6.5 H11 L12 10 M7 6.5 V4" />
        </svg>
      )
    case 'highway-bus':
    case 'rental-car':
      return (
        <svg {...common}>
          <rect x="2" y="3.5" width="12" height="8" rx="1.5" />
          <path d="M2 8 H14 M4.5 11.5 V13 M11.5 11.5 V13" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <path d="M1.5 5 H10 C 12.5 5, 14.3 6.8, 14.8 10 H1.5 Z M3 7 H9 M1.5 12.2 H14.5" />
        </svg>
      )
  }
}

function Transfer({ legs, label }: { legs: Leg[]; label?: string }) {
  const hours = legs.reduce((s, l) => s + l.hours, 0)
  const yen = legs.reduce((s, l) => s + l.yen, 0)
  return (
    <div className="grid grid-cols-[3.5rem_1fr] gap-x-5 md:grid-cols-[5rem_1fr] md:gap-x-8">
      <div className="relative flex justify-center">
        {/* Dashed gap in the rail = you're in transit; the dashes keep moving. */}
        <div className="transit-rail h-full w-[3px]" />
      </div>
      <Reveal variant="fade" className="flex flex-wrap items-center gap-x-4 gap-y-1 py-6 text-sm text-ink-soft">
        <span className="tnum text-[10px] uppercase tracking-[0.22em]">{label ?? 'Transfer'}</span>
        <span className="inline-flex items-center gap-2 text-ink">
          {legs.map((l, i) => (
            <Fragment key={i}>
              {i > 0 && <span className="text-ink-soft">→</span>}
              <span className="inline-flex items-center gap-1.5">
                <ModeIcon mode={l.mode} />
                {MODE_LABEL[l.mode]}
              </span>
            </Fragment>
          ))}
        </span>
        <span className="tnum">{hours}h</span>
        <span className="tnum">¥{yen.toLocaleString('en-US')}</span>
        {legs.every((l) => l.jrPassCovered) && (
          <span className="tnum border border-indigo/40 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-indigo">
            JR Pass
          </span>
        )}
      </Reveal>
    </div>
  )
}

export default function Timeline({ trip }: { trip: Itinerary }) {
  // A marker rides the rail at the reading line, showing the day you're on and
  // wearing that stop's colour. Each stop's line fills in behind it and empties
  // again if you scroll back up. All of this writes styles directly — no
  // re-render per frame.
  const rootRef = useRef<HTMLDivElement>(null)
  const trainRef = useRef<HTMLDivElement>(null)
  const dayRef = useRef<HTMLSpanElement>(null)

  useScrollFrame(() => {
    const root = rootRef.current
    const train = trainRef.current
    if (!root || !train) return
    const top = root.getBoundingClientRect().top
    const height = root.offsetHeight
    const reading = window.innerHeight * 0.42 - top
    const reduced = prefersReducedMotion()

    root.querySelectorAll<HTMLElement>('[data-rail]').forEach((rail) => {
      // Measure the track, not the fill — the fill's own scale would skew it.
      const r = rail.parentElement!.getBoundingClientRect()
      const p = reduced ? 1 : clamp((reading - (r.top - top)) / Math.max(1, r.height), 0, 1)
      rail.style.transform = `scaleY(${p})`
    })

    const y = clamp(reading, 0, height - 24)
    train.style.transform = `translate3d(-50%, ${y}px, 0)`
    train.style.opacity = reading > 0 && reading < height + 40 ? '1' : '0'

    let day: HTMLElement | null = null
    root.querySelectorAll<HTMLElement>('[data-day]').forEach((row) => {
      if (row.getBoundingClientRect().top - top <= reading + 8) day = row
    })
    const current = day as HTMLElement | null
    if (current && dayRef.current) {
      const label = `D${current.dataset.day!.padStart(2, '0')}`
      if (dayRef.current.textContent !== label) dayRef.current.textContent = label
      train.style.setProperty('--c', current.dataset.color!)
    }
  }, rootRef)

  let cursor = 0

  return (
    <div ref={rootRef} className="relative">
      <div
        ref={trainRef}
        aria-hidden
        className="moving-train no-print pointer-events-none absolute left-[1.75rem] top-0 z-20 opacity-0 transition-opacity duration-300 md:left-[2.5rem]"
        style={{ '--c': 'var(--color-sun)' } as CSSProperties}
      >
        <span
          ref={dayRef}
          className="train-marker tnum -mt-3 grid h-6 place-items-center rounded-full px-2 text-[10px] font-semibold tracking-[0.06em] text-white transition-colors duration-300"
          style={{ background: 'var(--c)' }}
        >
          D01
        </span>
      </div>

      {trip.stops.map((stop, i) => {
        const days = trip.days.slice(cursor, cursor + stop.days)
        cursor += stop.days
        const meta = REGION_META[stop.region.id]
        const transfer = trip.transfers[i] ?? []

        return (
          <Fragment key={stop.region.id}>
            {transfer.length > 0 && <Transfer legs={transfer} />}

            <Reveal>
              <div className="relative grid grid-cols-[3.5rem_1fr] gap-x-5 md:grid-cols-[5rem_1fr] md:gap-x-8">
                {/* The stop's name in kanji, set huge and faint behind it. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-6 right-0 select-none font-display text-[5.5rem] font-extrabold leading-none text-ink/[0.045] md:text-[9rem]"
                >
                  {stop.region.nameJa.split('・')[0]}
                </span>

                {/* rail column */}
                <div className="relative flex flex-col items-center">
                  <div
                    className="node-pop tnum relative z-10 grid h-11 w-11 place-items-center rounded-full text-[13px] font-semibold text-white shadow-[0_0_0_4px_var(--color-paper)] md:h-12 md:w-12"
                    style={{ background: meta.color }}
                  >
                    {meta.code}
                  </div>
                  <div className="relative mt-1 w-[3px] flex-1 bg-rule/70">
                    <div data-rail className="line-ink rail-fill absolute inset-0" style={{ background: meta.color }} />
                  </div>
                </div>

                {/* content */}
                <div className="relative pb-12">
                  <div className="mb-1 flex flex-wrap items-baseline gap-3">
                    <h4 className="font-display text-2xl font-bold leading-none md:text-3xl">{stop.region.name}</h4>
                    <span className="font-display text-lg text-ink-soft">{stop.region.nameJa}</span>
                    <span className="tnum ml-auto text-[11px] uppercase tracking-[0.18em] text-ink-soft">
                      {stop.days} {stop.days === 1 ? 'night' : 'nights'}
                    </span>
                  </div>
                  <p className="mb-7 max-w-xl text-sm text-ink-soft">{stop.region.blurb}</p>

                  <div className="space-y-6">
                    {days.map((day) => (
                      <div
                        key={day.day}
                        data-day={day.day}
                        data-color={meta.color}
                        className="grid grid-cols-[3rem_1fr] gap-4"
                      >
                        <div className="tnum pt-1 text-[11px] tracking-[0.1em] text-ink-soft">
                          D{String(day.day).padStart(2, '0')}
                        </div>
                        {day.activities.length === 0 ? (
                          <p className="pt-0.5 text-sm italic text-ink-soft">
                            Open day — wander, rest, or day-trip on your own.
                          </p>
                        ) : (
                          <ul className="stagger space-y-2.5">
                            {day.activities.map((a, k) => (
                              <li
                                key={a.id}
                                className="group flex gap-3 text-sm"
                                style={{ '--i': k + 2 } as CSSProperties}
                              >
                                <span
                                  className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full transition-transform duration-300 group-hover:scale-[1.8]"
                                  style={{ background: meta.color }}
                                />
                                <span className="leading-relaxed">
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                      `${a.name} ${stop.region.name} Japan`,
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium underline decoration-rule underline-offset-2 transition-colors hover:text-sun hover:decoration-sun"
                                  >
                                    {a.name}
                                  </a>
                                  {a.bookAhead && (
                                    <span className="tnum ml-1.5 align-middle text-[10px] uppercase tracking-[0.1em] text-sun">
                                      Book ahead
                                    </span>
                                  )}
                                  <span className="text-ink-soft"> — {a.blurb} </span>
                                  <span className="tnum whitespace-nowrap text-[11px] text-ink-soft">
                                    {a.hours}h · {a.yen > 0 ? `¥${a.yen.toLocaleString('en-US')}` : 'free'}
                                  </span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </Fragment>
        )
      })}

      {trip.returnLegs.length > 0 && <Transfer legs={trip.returnLegs} label="Return" />}

      <div className="grid grid-cols-[3.5rem_1fr] gap-x-5 md:grid-cols-[5rem_1fr] md:gap-x-8">
        <div className="flex justify-center">
          <div className="h-3 w-3 rounded-full bg-ink" />
        </div>
        <p className="tnum -mt-0.5 text-[11px] uppercase tracking-[0.22em] text-ink-soft">End of route</p>
      </div>
    </div>
  )
}
