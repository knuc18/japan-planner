import { useEffect, useState } from 'react'
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
import { planTrip, type Itinerary, type PlannerInput } from './lib/itinerary'
import { encodeInput, decodeInput } from './lib/share'
import { REGION_META } from './data/regions'

function Section({
  label,
  title,
  children,
}: {
  label: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-24">
      <Reveal>
        <div className="flex items-baseline gap-4 mb-8 pb-3 border-b border-ink">
          <span className="tnum text-[10px] tracking-[0.24em] uppercase text-ink-soft">{label}</span>
          <h3 className="font-display font-bold text-2xl md:text-3xl">{title}</h3>
        </div>
      </Reveal>
      {children}
    </section>
  )
}

export default function App() {
  const [input, setInput] = useState<PlannerInput | null>(() => decodeInput(location.hash.slice(1)))
  const [trip, setTrip] = useState<Itinerary | null>(() => {
    const initial = decodeInput(location.hash.slice(1))
    return initial ? planTrip(initial) : null
  })
  const [copied, setCopied] = useState(false)
  // Bumped only when the hash changes from outside (back/forward, pasted link)
  // so the wizard remounts with the incoming values instead of showing stale ones.
  const [formKey, setFormKey] = useState(0)

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
      setTrip(planTrip(next))
      setFormKey((k) => k + 1)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [input])

  function handleSubmit(next: PlannerInput) {
    setInput(next)
    setTrip(planTrip(next))
    requestAnimationFrame(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }))
  }

  function copyLink() {
    navigator.clipboard.writeText(location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <main>
      <ThemeToggle />
      <Hero onStart={() => document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth' })} />
      <Wizard key={formKey} onSubmit={handleSubmit} initial={input ?? undefined} />

      {trip && (
        <div id="results" className="px-6 pb-32 max-w-5xl mx-auto">
          <Reveal>
            <div className="flex items-end justify-between flex-wrap gap-6 mb-10">
              <div>
                <p className="tnum text-[11px] tracking-[0.32em] uppercase text-ink-soft mb-4">
                  Your route
                </p>
                <h2 className="font-display font-extrabold text-4xl md:text-5xl tracking-[-0.02em]">
                  {trip.days.length} days, {trip.stops.length}{' '}
                  {trip.stops.length === 1 ? 'stop' : 'stops'}
                </h2>
                <SeasonNote month={input?.travelMonth} year={input?.travelYear} />
              </div>
              <button
                onClick={copyLink}
                className="border border-rule hover:border-sun hover:text-sun px-5 py-2.5 text-xs tracking-[0.14em] uppercase transition-colors"
              >
                {copied ? 'Link copied' : 'Copy share link'}
              </button>
            </div>
          </Reveal>

          {/* Line legend — the colour key for the whole page. */}
          <Reveal>
            <div className="flex flex-wrap gap-x-5 gap-y-2 mb-10">
              {trip.stops.map((s) => {
                const meta = REGION_META[s.region.id]
                return (
                  <span key={s.region.id} className="inline-flex items-center gap-2 text-xs">
                    <span className="line-ink w-6 h-[3px]" style={{ background: meta.color }} />
                    <span className="tnum text-ink-soft">{meta.code}</span>
                    <span>{s.region.name}</span>
                  </span>
                )
              })}
            </div>
          </Reveal>

          <Reveal className="mb-24">
            <StatBand trip={trip} />
          </Reveal>

          <Section label="Fig. 01" title="The route">
            <Reveal>
              <div className="grid md:grid-cols-[1fr_minmax(0,20rem)] gap-8 items-start">
                <div className="bg-paper-2 p-3 sm:p-5 flex items-center">
                  <JapanMap stops={trip.stops} />
                </div>

                <ol className="border-t border-rule">
                  {trip.stops.map((s, i) => {
                    const meta = REGION_META[s.region.id]
                    const inbound = (trip.transfers[i] ?? []).reduce((sum, l) => sum + l.hours, 0)
                    return (
                      <li
                        key={s.region.id}
                        className="flex items-center gap-3 py-3 border-b border-rule"
                      >
                        <span
                          className="tnum shrink-0 w-8 h-8 rounded-full grid place-items-center text-[10px] font-semibold text-white"
                          style={{ background: meta.color }}
                        >
                          {meta.code}
                        </span>
                        <span className="text-sm leading-tight">
                          {s.region.name}
                          <span className="block tnum text-[11px] text-ink-soft">
                            {s.days} {s.days === 1 ? 'night' : 'nights'}
                            {inbound > 0 && ` · ${inbound}h in`}
                          </span>
                        </span>
                      </li>
                    )
                  })}
                  <li className="tnum py-3 text-[10px] tracking-[0.2em] uppercase text-ink-soft">
                    Positions are geographic · lines are schematic
                  </li>
                </ol>
              </div>
            </Reveal>
          </Section>

          <Section label="Fig. 02" title="Day by day">
            <Timeline trip={trip} />
          </Section>

          <Section label="Fig. 03" title="Getting around">
            <Reveal>
              <TransportTable trip={trip} />
            </Reveal>
          </Section>

          <Section label="Fig. 04" title="What it costs">
            <Reveal>
              <CostBreakdown trip={trip} />
            </Reveal>
          </Section>
        </div>
      )}

      <footer className="border-t border-rule py-12 px-6 flex flex-col items-center gap-4">
        <span className="block w-7 h-7 rounded-full bg-sun" aria-hidden />
        <p className="tnum text-[10px] tracking-[0.22em] uppercase text-ink-soft text-center">
          Built for wandering · Fares are estimates, not bookings
        </p>
      </footer>
    </main>
  )
}
