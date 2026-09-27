import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import Hero from './components/Hero'
import Wizard from './components/Wizard'
import StatBand from './components/StatBand'
import JapanMap from './components/JapanMap'
import Timeline from './components/Timeline'
import TransportTable from './components/TransportTable'
import CostBreakdown from './components/CostBreakdown'
import Reveal from './components/Reveal'
import ThemeToggle from './components/ThemeToggle'
import SeasonNote from './components/SeasonNote'
import SakuraField from './components/SakuraField'
import SectionNav from './components/SectionNav'
import Ticker from './components/Ticker'
import Footer from './components/Footer'
import {
  selectStops,
  buildItinerary,
  orderStops,
  regionDistances,
  type PlannerInput,
  type RouteStop,
} from './lib/itinerary'
import { encodeInput, decodeInput } from './lib/share'
import { downloadIcs } from './lib/ics'
import { REGIONS, REGION_META } from './data/regions'

function Section({
  id,
  label,
  ja,
  title,
  children,
}: {
  id: string
  label: string
  ja: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="mb-28 scroll-mt-10">
      <Reveal className="mb-10">
        <div className="relative flex items-baseline gap-4 pb-3">
          <span className="tnum text-[10px] uppercase tracking-[0.24em] text-ink-soft">{label}</span>
          <h3 className="font-display text-2xl font-bold md:text-4xl">
            <span className="title-mask">
              <span>{title}</span>
            </span>
          </h3>
          <span className="ml-auto font-display text-base tracking-[0.3em] text-ink-soft/70 md:text-lg">{ja}</span>
          <span aria-hidden className="rule-draw absolute inset-x-0 bottom-0 h-px bg-ink" />
        </div>
      </Reveal>
      {children}
    </section>
  )
}

function initialStops(input: PlannerInput | null): RouteStop[] | null {
  return input ? selectStops(input) : null
}

export default function App() {
  const [input, setInput] = useState<PlannerInput | null>(() => decodeInput(location.hash.slice(1)))
  const [stops, setStops] = useState<RouteStop[] | null>(() => initialStops(input))
  const [copied, setCopied] = useState(false)
  const [hoverStop, setHoverStop] = useState<string | null>(null)
  // Bumped only when the hash changes from outside (back/forward, pasted link)
  // so the wizard remounts with the incoming values instead of showing stale ones.
  const [formKey, setFormKey] = useState(0)

  const trip = useMemo(() => (input && stops ? buildItinerary(input, stops) : null), [input, stops])

  useEffect(() => {
    if (input) location.hash = encodeInput(input)
  }, [input])

  useEffect(() => {
    function onHashChange() {
      const next = decodeInput(location.hash.slice(1))
      if (!next) return
      // Ignore the hash we just wrote ourselves.
      if (input && encodeInput(next) === encodeInput(input)) return
      setInput(next)
      setStops(selectStops(next))
      setFormKey((k) => k + 1)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [input])

  function handleSubmit(next: PlannerInput) {
    setInput(next)
    setStops(selectStops(next))
    requestAnimationFrame(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }))
  }

  function copyLink() {
    navigator.clipboard.writeText(location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function adjustNights(regionId: string, delta: number) {
    setStops((prev) =>
      prev
        ? prev.map((s) =>
            s.region.id === regionId
              ? { ...s, days: Math.min(s.region.maxDays, Math.max(1, s.days + delta)) }
              : s,
          )
        : prev,
    )
  }

  function removeStop(regionId: string) {
    setStops((prev) => {
      if (!prev || prev.length <= 1) return prev
      if (prev[0].region.id === regionId) return prev // arrival stop anchors the route
      return prev.filter((s) => s.region.id !== regionId)
    })
  }

  function addStop(regionId: string) {
    setStops((prev) => {
      if (!prev || !input) return prev
      const region = REGIONS.find((r) => r.id === regionId)
      if (!region || prev.some((s) => s.region.id === regionId)) return prev
      const dist = regionDistances()
      const rest = [...prev.slice(1), { region, days: region.minDays }]
      return [prev[0], ...orderStops(input.arrival, rest, dist)]
    })
  }

  return (
    <main>
      <SakuraField />
      <div className="no-print">
        <ThemeToggle />
        <Hero onStart={() => document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth' })} />
        <Wizard key={formKey} onSubmit={handleSubmit} initial={input ?? undefined} />
      </div>

      {trip && (
        <div id="results" className="relative z-[2] mx-auto max-w-5xl scroll-mt-6 px-6 pb-32 pt-10">
          <Reveal>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="tnum mb-4 text-[11px] uppercase tracking-[0.32em] text-ink-soft">
                  Your route <span className="ml-2 font-display tracking-[0.2em]">旅程</span>
                </p>
                <h2 className="font-display text-4xl font-extrabold tracking-[-0.02em] md:text-6xl">
                  <Ticker value={String(trip.days.length)} /> days, <Ticker value={String(trip.stops.length)} />{' '}
                  {trip.stops.length === 1 ? 'stop' : 'stops'}
                </h2>
                <SeasonNote month={input?.travelMonth} year={input?.travelYear} />
              </div>
              <div className="no-print flex flex-wrap gap-3">
                <button
                  onClick={() => window.print()}
                  className="btn-line px-5 py-2.5 text-xs uppercase tracking-[0.14em]"
                >
                  Print
                </button>
                <button
                  onClick={() => input && downloadIcs(trip, input)}
                  className="btn-line px-5 py-2.5 text-xs uppercase tracking-[0.14em]"
                >
                  Add to calendar
                </button>
                <button
                  onClick={copyLink}
                  className={`btn-line px-5 py-2.5 text-xs uppercase tracking-[0.14em] ${copied ? 'border-sun text-sun' : ''}`}
                >
                  <span key={String(copied)} className="digit-in">
                    {copied ? '✓ Link copied' : 'Copy share link'}
                  </span>
                </button>
              </div>
            </div>
          </Reveal>

          {/* Line legend — the colour key for the whole page. */}
          <Reveal>
            <div className="stagger mb-10 flex flex-wrap gap-x-5 gap-y-2">
              {trip.stops.map((s, i) => {
                const meta = REGION_META[s.region.id]
                return (
                  <span
                    key={s.region.id}
                    className="inline-flex items-center gap-2 text-xs"
                    style={{ '--i': i } as CSSProperties}
                  >
                    <span className="line-ink h-[3px] w-6" style={{ background: meta.color }} />
                    <span className="tnum text-ink-soft">{meta.code}</span>
                    <span>{s.region.name}</span>
                  </span>
                )
              })}
            </div>
          </Reveal>

          <Reveal className="mb-28">
            <StatBand trip={trip} />
          </Reveal>

          <Section id="fig-route" label="Fig. 01" ja="路線" title="The route">
            <Reveal>
              <div className="grid md:grid-cols-[1fr_minmax(0,20rem)] gap-8 items-start">
                <div className="relative flex items-center bg-paper-2 p-3 sm:p-5">
                  <JapanMap stops={trip.stops} highlight={hoverStop} />
                </div>

                <ol className="border-t border-rule" onMouseLeave={() => setHoverStop(null)}>
                  {trip.stops.map((s, i) => {
                    const meta = REGION_META[s.region.id]
                    const inbound = (trip.transfers[i] ?? []).reduce((sum, l) => sum + l.hours, 0)
                    return (
                      <li
                        key={s.region.id}
                        onMouseEnter={() => setHoverStop(s.region.id)}
                        onFocus={() => setHoverStop(s.region.id)}
                        className={`pop-in flex items-center gap-3 border-b border-rule py-3 transition-[background-color,padding] duration-300 ${
                          hoverStop === s.region.id ? 'bg-paper-2 pl-2' : ''
                        }`}
                        style={{ '--delay': `${i * 60}ms` } as CSSProperties}
                      >
                        <span
                          className="tnum grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white transition-transform duration-300"
                          style={{ background: meta.color, transform: hoverStop === s.region.id ? 'scale(1.12)' : undefined }}
                        >
                          {meta.code}
                        </span>
                        <span className="text-sm leading-tight flex-1">
                          {s.region.name}
                          <span className="block tnum text-[11px] text-ink-soft">
                            <span key={s.days} className="digit-in">
                              {s.days}
                            </span>{' '}
                            {s.days === 1 ? 'night' : 'nights'}
                            {inbound > 0 && ` · ${inbound}h in`}
                          </span>
                        </span>
                        <span className="no-print flex items-center gap-1 shrink-0">
                          <button
                            aria-label={`Remove a night from ${s.region.name}`}
                            onClick={() => adjustNights(s.region.id, -1)}
                            disabled={s.days <= 1}
                            className="tnum w-6 h-6 grid place-items-center border border-rule hover:border-sun hover:text-sun disabled:opacity-30 disabled:hover:border-rule disabled:hover:text-ink text-sm"
                          >
                            −
                          </button>
                          <button
                            aria-label={`Add a night to ${s.region.name}`}
                            onClick={() => adjustNights(s.region.id, 1)}
                            disabled={s.days >= s.region.maxDays}
                            className="tnum w-6 h-6 grid place-items-center border border-rule hover:border-sun hover:text-sun disabled:opacity-30 disabled:hover:border-rule disabled:hover:text-ink text-sm"
                          >
                            +
                          </button>
                          {i > 0 && (
                            <button
                              aria-label={`Remove ${s.region.name} from the route`}
                              onClick={() => removeStop(s.region.id)}
                              className="w-6 h-6 grid place-items-center border border-rule hover:border-sun hover:text-sun text-xs ml-1"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      </li>
                    )
                  })}
                  {REGIONS.some((r) => !trip.stops.some((s) => s.region.id === r.id)) && (
                    <li className="no-print py-3">
                      <select
                        value=""
                        aria-label="Add a stop to the route"
                        onChange={(e) => {
                          if (e.target.value) addStop(e.target.value)
                        }}
                        className="select-line w-full border border-rule px-3 py-2 text-sm"
                      >
                        <option value="">+ Add a stop…</option>
                        {REGIONS.filter((r) => !trip.stops.some((s) => s.region.id === r.id)).map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </li>
                  )}
                  <li className="tnum py-3 text-[10px] tracking-[0.2em] uppercase text-ink-soft">
                    Positions are geographic · lines are schematic
                  </li>
                </ol>
              </div>
            </Reveal>
          </Section>

          <Section id="fig-days" label="Fig. 02" ja="日程" title="Day by day">
            <Timeline trip={trip} />
          </Section>

          <Section id="fig-transit" label="Fig. 03" ja="交通" title="Getting around">
            <Reveal>
              <TransportTable trip={trip} />
            </Reveal>
          </Section>

          <Section id="fig-cost" label="Fig. 04" ja="費用" title="What it costs">
            <Reveal>
              <CostBreakdown trip={trip} partySize={input?.partySize} budgetCap={input?.budgetCap} />
            </Reveal>
          </Section>
        </div>
      )}

      {trip && <SectionNav />}
      <Footer />
    </main>
  )
}
