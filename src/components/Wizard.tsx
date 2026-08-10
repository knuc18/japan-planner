import { useState } from 'react'
import type { Interest, Tier } from '../data/regions'
import type { Pace, PlannerInput } from '../lib/itinerary'
import { MONTHS } from '../data/seasons'
import Reveal from './Reveal'
import SeasonNote from './SeasonNote'

const THIS_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = [THIS_YEAR, THIS_YEAR + 1, THIS_YEAR + 2]

const INTEREST_OPTIONS: { id: Interest; label: string; ja: string }[] = [
  { id: 'food', label: 'Food', ja: '食' },
  { id: 'history', label: 'History & Temples', ja: '史' },
  { id: 'nature', label: 'Nature', ja: '自然' },
  { id: 'pop-culture', label: 'Pop Culture', ja: '文化' },
  { id: 'onsen', label: 'Onsen', ja: '温泉' },
  { id: 'nightlife', label: 'Nightlife', ja: '夜' },
  { id: 'art', label: 'Art & Design', ja: '芸術' },
  { id: 'hiking', label: 'Hiking', ja: '登山' },
]

const PACE_OPTIONS: { id: Pace; label: string; hint: string }[] = [
  { id: 'relaxed', label: 'Relaxed', hint: 'About 2 things a day' },
  { id: 'balanced', label: 'Balanced', hint: 'About 3 things a day' },
  { id: 'packed', label: 'Packed', hint: 'Four or five a day' },
]

const BUDGET_OPTIONS: { id: Tier; label: string; hint: string }[] = [
  { id: 'budget', label: 'Budget', hint: 'Hostels, konbini, local trains' },
  { id: 'mid', label: 'Mid-range', hint: 'Business hotels, izakaya dinners' },
  { id: 'luxury', label: 'Luxury', hint: 'Ryokan, kaiseki, the works' },
]

function Field({ n, label, children }: { n: number; label: string; children: React.ReactNode }) {
  return (
    <Reveal className="grid grid-cols-[2.5rem_1fr] gap-x-4 md:gap-x-6 pb-10 mb-10 border-b border-rule last:border-b-0">
      <div className="tnum text-[11px] text-ink-soft pt-1.5">{String(n).padStart(2, '0')}</div>
      <div>
        <p className="font-display font-bold text-xl md:text-2xl mb-5">{label}</p>
        {children}
      </div>
    </Reveal>
  )
}

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
  const [travelMonth, setTravelMonth] = useState<number | undefined>(initial?.travelMonth)
  const [travelYear, setTravelYear] = useState<number | undefined>(initial?.travelYear ?? THIS_YEAR)
  const [partySize, setPartySize] = useState(initial?.partySize ?? 1)
  const [budgetCap, setBudgetCap] = useState<number | undefined>(initial?.budgetCap)

  function toggleInterest(id: Interest) {
    setInterests((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const card = (active: boolean) =>
    `text-left p-4 border transition-all duration-200 ${
      active
        ? 'border-sun bg-sun text-white'
        : 'border-rule hover:border-sun hover:-translate-y-0.5'
    }`

  return (
    <section id="planner" className="py-24 md:py-32 px-6 max-w-3xl mx-auto">
      <Reveal>
        <p className="tnum text-[11px] tracking-[0.32em] uppercase text-ink-soft mb-4">Plan a route</p>
        <h2 className="font-display font-extrabold text-4xl md:text-5xl mb-14 tracking-[-0.02em]">
          Seven questions
        </h2>
      </Reveal>

      <Field n={1} label="How many days do you have?">
        <div className="flex items-baseline gap-4 mb-4">
          <span className="tnum text-5xl md:text-6xl font-medium leading-none">{days}</span>
          <span className="tnum text-[11px] tracking-[0.2em] uppercase text-ink-soft">
            {days === 1 ? 'day' : 'days'}
          </span>
        </div>
        <input
          type="range"
          min={3}
          max={30}
          value={days}
          aria-label="Trip length in days"
          onChange={(e) => setDays(Number(e.target.value))}
          className="w-full h-1 bg-rule appearance-none cursor-pointer"
        />
        <div className="tnum flex justify-between text-[10px] tracking-[0.16em] uppercase text-ink-soft mt-3">
          <span>3 · a long weekend</span>
          <span>30 · a full month</span>
        </div>
      </Field>

      <Field n={2} label="When are you travelling?">
        <div className="flex flex-wrap gap-3">
          <select
            aria-label="Travel month"
            value={travelMonth ?? ''}
            onChange={(e) => setTravelMonth(e.target.value ? Number(e.target.value) : undefined)}
            className="border border-rule bg-paper px-4 py-2.5 text-sm min-w-[9rem]"
          >
            <option value="">Not sure yet</option>
            {MONTHS.map((m) => (
              <option key={m.month} value={m.month}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Travel year"
            value={travelYear ?? ''}
            disabled={!travelMonth}
            onChange={(e) => setTravelYear(e.target.value ? Number(e.target.value) : undefined)}
            className="border border-rule bg-paper px-4 py-2.5 text-sm disabled:opacity-40"
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <SeasonNote month={travelMonth} year={travelYear} />
        {!travelMonth && (
          <p className="text-xs text-ink-soft mt-3">Optional — pick a month to see what season it'll be.</p>
        )}
      </Field>

      <Field n={3} label="What are you here for?">
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((opt) => {
            const active = interests.includes(opt.id)
            return (
              <button
                key={opt.id}
                aria-pressed={active}
                onClick={() => toggleInterest(opt.id)}
                className={`inline-flex items-center gap-2.5 pl-3 pr-4 py-2.5 border text-sm transition-all duration-200 ${
                  active
                    ? 'border-sun bg-sun text-white'
                    : 'border-rule hover:border-sun hover:-translate-y-0.5'
                }`}
              >
                <span className="font-display text-xs opacity-70">{opt.ja}</span>
                {opt.label}
              </button>
            )
          })}
        </div>
        {interests.length === 0 && (
          <p className="text-xs text-ink-soft mt-3">Pick at least one, or we'll plan the greatest hits.</p>
        )}
      </Field>

      <Field n={4} label="What pace suits you?">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PACE_OPTIONS.map((opt) => (
            <button key={opt.id} onClick={() => setPace(opt.id)} className={card(pace === opt.id)}>
              <div className="font-display font-bold">{opt.label}</div>
              <div className="text-xs opacity-70 mt-1">{opt.hint}</div>
            </button>
          ))}
        </div>
      </Field>

      <Field n={5} label="How are you travelling?">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {BUDGET_OPTIONS.map((opt) => (
            <button key={opt.id} onClick={() => setBudget(opt.id)} className={card(budget === opt.id)}>
              <div className="font-display font-bold">{opt.label}</div>
              <div className="text-xs opacity-70 mt-1">{opt.hint}</div>
            </button>
          ))}
        </div>
      </Field>

      <Field n={6} label="Where do you land?">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(
            [
              { id: 'tokyo', label: 'Tokyo', hint: 'Narita or Haneda' },
              { id: 'osaka', label: 'Osaka', hint: 'Kansai International' },
            ] as const
          ).map((opt) => (
            <button key={opt.id} onClick={() => setArrival(opt.id)} className={card(arrival === opt.id)}>
              <div className="font-display font-bold">{opt.label}</div>
              <div className="text-xs opacity-70 mt-1">{opt.hint}</div>
            </button>
          ))}
        </div>
      </Field>

      <Field n={7} label="Who's going, and is there a ceiling?">
        <div className="flex flex-wrap gap-3 items-start">
          <div className="flex items-center border border-rule">
            <button
              type="button"
              aria-label="Fewer travelers"
              onClick={() => setPartySize((n) => Math.max(1, n - 1))}
              className="w-10 h-10 grid place-items-center hover:text-sun text-sm"
            >
              −
            </button>
            <span className="tnum w-12 text-center text-sm">
              {partySize} {partySize === 1 ? 'traveler' : 'travelers'}
            </span>
            <button
              type="button"
              aria-label="More travelers"
              onClick={() => setPartySize((n) => Math.min(12, n + 1))}
              className="w-10 h-10 grid place-items-center hover:text-sun text-sm"
            >
              +
            </button>
          </div>
          <div className="flex items-center border border-rule px-4 h-10">
            <span className="text-sm text-ink-soft mr-2">¥</span>
            <input
              type="number"
              min={0}
              step={10000}
              placeholder="No ceiling"
              aria-label="Total budget ceiling in yen, for the whole party"
              value={budgetCap ?? ''}
              onChange={(e) => setBudgetCap(e.target.value ? Number(e.target.value) : undefined)}
              className="tnum bg-transparent text-sm w-32 outline-none"
            />
          </div>
        </div>
        <p className="text-xs text-ink-soft mt-3">
          Optional — set a total budget for the whole party and we'll flag it if the plan runs over.
        </p>
      </Field>

      <Reveal>
        <button
          onClick={() =>
            onSubmit({
              days,
              interests,
              pace,
              budget,
              arrival,
              travelMonth,
              travelYear: travelMonth ? travelYear : undefined,
              partySize,
              budgetCap,
            })
          }
          className="group w-full bg-sun text-white py-5 text-sm tracking-[0.16em] uppercase inline-flex items-center justify-center gap-4 hover:gap-6 transition-[gap] duration-300"
        >
          Build the route
          <span aria-hidden>→</span>
        </button>
      </Reveal>
    </section>
  )
}
