import { useState } from 'react'
import type { Interest, Tier } from '../data/regions'
import type { Pace, PlannerInput } from '../lib/itinerary'
import Reveal from './Reveal'

const INTEREST_OPTIONS: { id: Interest; label: string }[] = [
  { id: 'food', label: 'Food' },
  { id: 'history', label: 'History & Temples' },
  { id: 'nature', label: 'Nature' },
  { id: 'pop-culture', label: 'Pop Culture' },
  { id: 'onsen', label: 'Onsen' },
  { id: 'nightlife', label: 'Nightlife' },
  { id: 'art', label: 'Art & Design' },
  { id: 'hiking', label: 'Hiking' },
]

const PACE_OPTIONS: { id: Pace; label: string; hint: string }[] = [
  { id: 'relaxed', label: 'Relaxed', hint: '~2 things a day' },
  { id: 'balanced', label: 'Balanced', hint: '~3 things a day' },
  { id: 'packed', label: 'Packed', hint: '~4-5 things a day' },
]

const BUDGET_OPTIONS: { id: Tier; label: string; hint: string }[] = [
  { id: 'budget', label: 'Budget', hint: 'Hostels, konbini, local trains' },
  { id: 'mid', label: 'Mid-range', hint: '3-star hotels, izakaya dinners' },
  { id: 'luxury', label: 'Luxury', hint: 'Ryokan, kaiseki, the works' },
]

export default function Wizard({
  onSubmit,
  initial,
}: {
  onSubmit: (input: PlannerInput) => void
  initial?: PlannerInput
}) {
  const [days, setDays] = useState(initial?.days ?? 10)
  const [interests, setInterests] = useState<Interest[]>(initial?.interests ?? ['food', 'history'])
  const [pace, setPace] = useState<Pace>(initial?.pace ?? 'balanced')
  const [budget, setBudget] = useState<Tier>(initial?.budget ?? 'mid')
  const [arrival, setArrival] = useState<'tokyo' | 'osaka'>(initial?.arrival ?? 'tokyo')

  function toggleInterest(id: Interest) {
    setInterests((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  return (
    <section id="planner" className="min-h-screen py-24 px-6 max-w-3xl mx-auto">
      <Reveal>
        <p className="font-display tracking-[0.3em] text-sm text-vermilion mb-3 uppercase">Step One</p>
        <h2 className="font-display text-4xl md:text-5xl mb-12">Plan your trip</h2>
      </Reveal>

      <Reveal className="mb-12">
        <label className="block font-display text-xl mb-4">
          How many days? <span className="text-vermilion">{days}</span>
        </label>
        <input
          type="range"
          min={3}
          max={30}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="w-full h-1 bg-stone/30 appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-stone mt-2">
          <span>A long weekend</span>
          <span>A full month</span>
        </div>
      </Reveal>

      <Reveal className="mb-12">
        <p className="font-display text-xl mb-4">What are you into?</p>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => toggleInterest(opt.id)}
              className={`px-4 py-2 border-2 text-sm transition-colors ${
                interests.includes(opt.id)
                  ? 'border-vermilion bg-vermilion text-washi'
                  : 'border-sumi/30 hover:border-sumi'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal className="mb-12">
        <p className="font-display text-xl mb-4">Pace</p>
        <div className="grid grid-cols-3 gap-3">
          {PACE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setPace(opt.id)}
              className={`text-left p-4 border-2 transition-colors ${
                pace === opt.id ? 'border-indigo bg-indigo/10' : 'border-sumi/30 hover:border-sumi'
              }`}
            >
              <div className="font-display">{opt.label}</div>
              <div className="text-xs text-stone mt-1">{opt.hint}</div>
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal className="mb-12">
        <p className="font-display text-xl mb-4">Budget</p>
        <div className="grid grid-cols-3 gap-3">
          {BUDGET_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setBudget(opt.id)}
              className={`text-left p-4 border-2 transition-colors ${
                budget === opt.id ? 'border-gold bg-gold/10' : 'border-sumi/30 hover:border-sumi'
              }`}
            >
              <div className="font-display">{opt.label}</div>
              <div className="text-xs text-stone mt-1">{opt.hint}</div>
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal className="mb-12">
        <p className="font-display text-xl mb-4">Arriving into</p>
        <div className="grid grid-cols-2 gap-3">
          {(['tokyo', 'osaka'] as const).map((id) => (
            <button
              key={id}
              onClick={() => setArrival(id)}
              className={`p-4 border-2 font-display capitalize transition-colors ${
                arrival === id ? 'border-sumi bg-sumi text-washi' : 'border-sumi/30 hover:border-sumi'
              }`}
            >
              {id === 'tokyo' ? 'Tokyo (Narita/Haneda)' : 'Osaka (Kansai)'}
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <button
          onClick={() => onSubmit({ days, interests, pace, budget, arrival })}
          className="w-full border-2 border-vermilion bg-vermilion text-washi py-4 font-display text-lg hover:bg-transparent hover:text-vermilion transition-colors"
        >
          Build my itinerary →
        </button>
      </Reveal>
    </section>
  )
}
