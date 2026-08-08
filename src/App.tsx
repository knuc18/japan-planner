import { useEffect, useState } from 'react'
import Hero from './components/Hero'
import Wizard from './components/Wizard'
import StatBand from './components/StatBand'
import JapanMap from './components/JapanMap'
import Timeline from './components/Timeline'
import TransportTable from './components/TransportTable'
import CostBreakdown from './components/CostBreakdown'
import Reveal from './components/Reveal'
import { planTrip, type Itinerary, type PlannerInput } from './lib/itinerary'
import { encodeInput, decodeInput } from './lib/share'

export default function App() {
  const [input, setInput] = useState<PlannerInput | null>(() => decodeInput(location.hash.slice(1)))
  const [trip, setTrip] = useState<Itinerary | null>(() => {
    const initial = decodeInput(location.hash.slice(1))
    return initial ? planTrip(initial) : null
  })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (input) {
      location.hash = encodeInput(input)
    }
  }, [input])

  function handleSubmit(next: PlannerInput) {
    setInput(next)
    setTrip(planTrip(next))
    requestAnimationFrame(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  function scrollToPlanner() {
    document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth' })
  }

  function copyLink() {
    navigator.clipboard.writeText(location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <main>
      <Hero onStart={scrollToPlanner} />
      <Wizard onSubmit={handleSubmit} initial={input ?? undefined} />

      {trip && (
        <section id="results" className="px-6 pb-32 max-w-5xl mx-auto">
          <Reveal>
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div>
                <p className="font-display tracking-[0.3em] text-sm text-vermilion mb-2 uppercase">Your Itinerary</p>
                <h2 className="font-display text-3xl md:text-4xl">{trip.days.length} days across Japan</h2>
              </div>
              <button
                onClick={copyLink}
                className="border-2 border-sumi/30 px-5 py-2 text-sm hover:border-sumi transition-colors"
              >
                {copied ? 'Copied!' : 'Share this trip'}
              </button>
            </div>
          </Reveal>

          <Reveal>
            <StatBand trip={trip} />
          </Reveal>

          <Reveal className="mb-16">
            <div className="border-2 border-sumi/15 p-4 aspect-[4/5] md:aspect-[4/4] max-h-[600px]">
              <JapanMap stops={trip.stops} />
            </div>
          </Reveal>

          <Reveal className="mb-16">
            <h3 className="font-display text-2xl mb-6">Day by day</h3>
            <Timeline trip={trip} />
          </Reveal>

          <Reveal className="mb-16">
            <h3 className="font-display text-2xl mb-6">Getting around</h3>
            <TransportTable trip={trip} />
          </Reveal>

          <Reveal>
            <h3 className="font-display text-2xl mb-6">Cost breakdown</h3>
            <CostBreakdown trip={trip} />
          </Reveal>
        </section>
      )}

      <footer className="text-center text-xs text-stone py-10 border-t border-sumi/10">
        Built for wandering. Fares and prices are estimates, not bookings.
      </footer>
    </main>
  )
}
