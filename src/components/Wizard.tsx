import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { Interest, Tier } from '../data/regions'
import { selectStops, type Pace, type PlannerInput } from '../lib/itinerary'
import { MONTHS, MONTH_BY_NUMBER } from '../data/seasons'
import { clamp, prefersReducedMotion, useScrollFrame } from '../lib/motion'
import { releasePetals } from '../lib/petals'
import Reveal from './Reveal'
import SeasonNote from './SeasonNote'
import RoutePreview from './RoutePreview'

const THIS_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = [THIS_YEAR, THIS_YEAR + 1, THIS_YEAR + 2]
const MIN_DAYS = 3
const MAX_DAYS = 30

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

const PACE_OPTIONS: { id: Pace; label: string; hint: string; stops: number }[] = [
  { id: 'relaxed', label: 'Relaxed', hint: 'About 2 things a day', stops: 2 },
  { id: 'balanced', label: 'Balanced', hint: 'About 3 things a day', stops: 3 },
  { id: 'packed', label: 'Packed', hint: 'Four or five a day', stops: 5 },
]

const BUDGET_OPTIONS: { id: Tier; label: string; hint: string; yen: number }[] = [
  { id: 'budget', label: 'Budget', hint: 'Hostels, konbini, local trains', yen: 1 },
  { id: 'mid', label: 'Mid-range', hint: 'Business hotels, izakaya dinners', yen: 2 },
  { id: 'luxury', label: 'Luxury', hint: 'Ryokan, kaiseki, the works', yen: 3 },
]

const ARRIVAL_OPTIONS = [
  { id: 'tokyo', label: 'Tokyo', ja: '東京', codes: 'NRT · HND', hint: 'Narita or Haneda' },
  { id: 'osaka', label: 'Osaka', ja: '大阪', codes: 'KIX', hint: 'Kansai International' },
] as const

// Week marks under the days slider.
const WEEKS = [7, 14, 21, 28]

/** Position along the slider track, allowing for the thumb's radius at each end. */
const trackPos = (days: number) =>
  `calc(12px + (100% - 24px) * ${(days - MIN_DAYS) / (MAX_DAYS - MIN_DAYS)})`

function Field({ n, label, children }: { n: number; label: string; children: ReactNode }) {
  return (
    <div className="relative grid grid-cols-[2.5rem_1fr] gap-x-4 pb-16 last:pb-0 md:gap-x-8">
      <div className="flex justify-center">
        <span
          data-station
          className="station tnum relative z-10 grid h-9 w-9 place-items-center rounded-full border-2 border-rule bg-paper text-[11px] text-ink-soft"
        >
          {String(n).padStart(2, '0')}
        </span>
      </div>
      <Reveal>
        <p className="mb-6 pt-1 font-display text-xl font-bold md:text-2xl">{label}</p>
        {children}
      </Reveal>
    </div>
  )
}

/** A choice card. Selected cards get a sun-red station dot in the corner. */
function Card({
  active,
  onClick,
  children,
  className = '',
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`group relative border p-4 text-left transition-[border-color,background-color,transform,box-shadow] duration-300 ${
        active
          ? 'border-sun bg-sun/[0.06] shadow-[0_10px_30px_-18px_var(--color-sun)]'
          : 'border-rule hover:-translate-y-0.5 hover:border-ink/40'
      } ${className}`}
    >
      <span
        aria-hidden
        className={`absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-sun transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          active ? 'scale-100' : 'scale-0'
        }`}
      />
      {children}
    </button>
  )
}

/** Shinkansen in profile, for the departure whoosh. */
function LongTrain() {
  return (
    <svg viewBox="0 0 300 28" className="h-7 w-[300px]" aria-hidden>
      <path d="M0 6 H 220 C 250 6, 282 14, 300 25 V 27 H 0 Z" fill="var(--color-ink)" />
      {Array.from({ length: 16 }, (_, i) => (
        <rect key={i} x={10 + i * 13} y="11" width="8" height="4" rx="1.5" fill="var(--color-paper)" opacity="0.85" />
      ))}
      <rect x="0" y="20" width="290" height="2" fill="var(--color-sun)" />
    </svg>
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
  const [punched, setPunched] = useState(false)

  // The planner is cheap enough to run on every change, so the route line
  // redraws live as you answer.
  const preview = useMemo(
    () => selectStops({ days, interests, pace, budget, arrival }),
    [days, interests, pace, budget, arrival],
  )

  // Any change after boarding issues a fresh ticket.
  useEffect(() => {
    setPunched(false)
  }, [days, interests, pace, budget, arrival, travelMonth, travelYear, partySize, budgetCap])

  function toggleInterest(id: Interest) {
    setInterests((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  // The questions sit on a line; it fills in sun-red as you read down it and
  // each station lights as you pass.
  const listRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  useScrollFrame(() => {
    const list = listRef.current
    const rail = railRef.current
    const fill = fillRef.current
    if (!list || !rail || !fill) return
    const nodes = list.querySelectorAll<HTMLElement>('[data-station]')
    if (nodes.length < 2) return
    const top = list.getBoundingClientRect().top
    const centre = (el: HTMLElement) => {
      const r = el.getBoundingClientRect()
      return r.top + r.height / 2 - top
    }
    const start = centre(nodes[0])
    const end = centre(nodes[nodes.length - 1])
    const reading = window.innerHeight * 0.58 - top
    rail.style.top = `${start}px`
    rail.style.height = `${end - start}px`
    fill.style.transform = `scaleY(${clamp((reading - start) / (end - start), 0, 1)})`
    nodes.forEach((n) => n.classList.toggle('is-passed', centre(n) <= reading))
  }, listRef)

  const buttonRef = useRef<HTMLButtonElement>(null)

  function submit() {
    const input: PlannerInput = {
      days,
      interests,
      pace,
      budget,
      arrival,
      travelMonth,
      travelYear: travelMonth ? travelYear : undefined,
      partySize,
      budgetCap,
    }
    if (prefersReducedMotion()) {
      onSubmit(input)
      return
    }
    // Punch the ticket, let the train leave, then go.
    setPunched(true)
    const b = buttonRef.current?.getBoundingClientRect()
    if (b) releasePetals({ x: b.left + b.width / 2, y: b.top + b.height / 2, count: 18, force: 280 })
    window.setTimeout(() => onSubmit(input), 560)
  }

  const month = travelMonth ? MONTH_BY_NUMBER.get(travelMonth) : undefined
  const serial = `${String(days).padStart(2, '0')}-${arrival === 'tokyo' ? 'TY' : 'OS'}-${interests.length}${pace[0]}${budget[0]}`.toUpperCase()
  const home = ARRIVAL_OPTIONS.find((a) => a.id === arrival)!

  return (
    <section id="planner" className="relative z-[2] mx-auto max-w-3xl px-6 py-24 md:py-36">
      <Reveal className="mb-16">
        <p className="tnum mb-4 text-[11px] uppercase tracking-[0.32em] text-ink-soft">Plan a route</p>
        <h2 className="font-display text-4xl font-extrabold tracking-[-0.02em] md:text-6xl">
          Seven questions
          <span className="mt-3 block font-display text-lg font-medium tracking-[0.3em] text-ink-soft sm:ml-4 sm:mt-0 sm:inline sm:align-middle md:text-xl">
            七つの質問
          </span>
        </h2>
      </Reveal>

      <div ref={listRef} className="relative">
        {/* The line the questions hang on. */}
        <div
          ref={railRef}
          aria-hidden
          className="absolute left-[1.25rem] w-[3px] -translate-x-1/2 bg-rule"
        >
          <div ref={fillRef} className="rail-fill h-full w-full bg-sun" />
        </div>

        <Field n={1} label="How many days do you have?">
          <div className="mb-3 flex items-baseline gap-4">
            <span className="tnum inline-block min-w-[2ch] text-6xl font-medium leading-none md:text-7xl">
              <span key={days} className="digit-in">
                {days}
              </span>
            </span>
            <span className="tnum text-[11px] uppercase tracking-[0.2em] text-ink-soft">
              {days === 1 ? 'day' : 'days'}
              {days >= 7 && (
                <span className="ml-2 normal-case tracking-normal">
                  · {days % 7 === 0 ? `${days / 7} wk` : `${(days / 7).toFixed(1)} wk`}
                </span>
              )}
            </span>
          </div>
          <input
            type="range"
            min={MIN_DAYS}
            max={MAX_DAYS}
            value={days}
            aria-label="Trip length in days"
            onChange={(e) => setDays(Number(e.target.value))}
            className="rail-range"
            style={{ '--fill': `${((days - MIN_DAYS) / (MAX_DAYS - MIN_DAYS)) * 100}%` } as CSSProperties}
          />
          <div className="relative mt-1 h-7" aria-hidden>
            {WEEKS.map((w) => (
              <span
                key={w}
                className={`tnum absolute top-0 flex -translate-x-1/2 flex-col items-center text-[9px] uppercase tracking-[0.12em] transition-colors ${
                  days >= w ? 'text-sun' : 'text-ink-soft'
                }`}
                style={{ left: trackPos(w) }}
              >
                <span className="mb-1 h-2 w-px bg-current" />
                {w / 7}wk
              </span>
            ))}
          </div>
          <div className="mt-5 border-t border-dashed border-rule pt-5">
            <p className="tnum mb-3 text-[10px] uppercase tracking-[0.22em] text-ink-soft">
              That reaches · {preview.length} {preview.length === 1 ? 'stop' : 'stops'}
            </p>
            <RoutePreview stops={preview} />
          </div>
        </Field>

        <Field n={2} label="When are you travelling?">
          <div className="flex flex-wrap gap-3">
            <select
              aria-label="Travel month"
              value={travelMonth ?? ''}
              onChange={(e) => setTravelMonth(e.target.value ? Number(e.target.value) : undefined)}
              className="select-line min-w-[10rem] border border-rule px-4 py-2.5 text-sm"
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
              className="select-line border border-rule px-4 py-2.5 text-sm disabled:opacity-40"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div key={travelMonth ?? 0} className="rise">
            <SeasonNote month={travelMonth} year={travelYear} />
          </div>
          {!travelMonth && (
            <p className="mt-3 text-xs text-ink-soft">Optional — pick a month to see what season it'll be.</p>
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
                  className={`inline-flex items-center gap-2.5 border py-2 pl-2 pr-4 text-sm transition-[border-color,background-color,transform] duration-300 ${
                    active ? 'border-sun bg-sun/[0.07]' : 'border-rule hover:-translate-y-0.5 hover:border-ink/40'
                  }`}
                >
                  {/* Selected interests get their kanji pressed as a small seal. */}
                  <span
                    key={String(active)}
                    className={`grid h-6 min-w-6 place-items-center px-1 font-display text-xs leading-none ${
                      active ? 'pop-in rounded-[3px] bg-sun text-white' : 'text-ink-soft'
                    }`}
                  >
                    {opt.ja}
                  </span>
                  {opt.label}
                </button>
              )
            })}
          </div>
          {interests.length === 0 && (
            <p className="mt-3 text-xs text-ink-soft">Pick at least one, or we'll plan the greatest hits.</p>
          )}
        </Field>

        <Field n={4} label="What pace suits you?">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PACE_OPTIONS.map((opt) => {
              const active = pace === opt.id
              return (
                <Card key={opt.id} active={active} onClick={() => setPace(opt.id)}>
                  {/* A day drawn as a little line: one station per thing you do. */}
                  <span className="mb-4 flex h-3 items-center" aria-hidden>
                    {Array.from({ length: opt.stops }, (_, i) => (
                      <span key={i} className="contents">
                        {i > 0 && (
                          <span
                            className={`h-[2px] w-4 transition-colors duration-500 ${active ? 'bg-sun' : 'bg-rule'}`}
                            style={{ transitionDelay: `${i * 70}ms` }}
                          />
                        )}
                        <span
                          className={`h-2.5 w-2.5 rounded-full border-2 transition-colors duration-500 ${
                            active ? 'border-sun bg-sun' : 'border-rule bg-paper'
                          }`}
                          style={{ transitionDelay: `${i * 70}ms` }}
                        />
                      </span>
                    ))}
                  </span>
                  <span className="block font-display font-bold">{opt.label}</span>
                  <span className="mt-1 block text-xs text-ink-soft">{opt.hint}</span>
                </Card>
              )
            })}
          </div>
        </Field>

        <Field n={5} label="How are you travelling?">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {BUDGET_OPTIONS.map((opt) => {
              const active = budget === opt.id
              return (
                <Card key={opt.id} active={active} onClick={() => setBudget(opt.id)}>
                  <span className="tnum mb-3 block text-lg leading-none" aria-hidden>
                    {[1, 2, 3].map((k) => (
                      <span
                        key={k}
                        className={`transition-colors duration-300 ${
                          k <= opt.yen ? (active ? 'text-sun' : 'text-ink') : 'text-ink/15'
                        }`}
                      >
                        ¥
                      </span>
                    ))}
                  </span>
                  <span className="block font-display font-bold">{opt.label}</span>
                  <span className="mt-1 block text-xs text-ink-soft">{opt.hint}</span>
                </Card>
              )
            })}
          </div>
        </Field>

        <Field n={6} label="Where do you land?">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ARRIVAL_OPTIONS.map((opt) => (
              <Card key={opt.id} active={arrival === opt.id} onClick={() => setArrival(opt.id)}>
                <span className="flex items-baseline justify-between gap-4 pr-6">
                  <span className="font-display text-2xl font-bold">
                    {opt.label}
                    <span className="ml-2 text-base font-medium text-ink-soft">{opt.ja}</span>
                  </span>
                  <span className="tnum text-sm tracking-[0.08em] text-ink-soft">{opt.codes}</span>
                </span>
                <span className="mt-1 block text-xs text-ink-soft">{opt.hint}</span>
              </Card>
            ))}
          </div>
        </Field>

        <Field n={7} label="Who's going, and is there a ceiling?">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex items-center border border-rule">
              <button
                type="button"
                aria-label="Fewer travelers"
                onClick={() => setPartySize((n) => Math.max(1, n - 1))}
                className="grid h-11 w-11 place-items-center text-sm transition-colors hover:bg-ink hover:text-paper"
              >
                −
              </button>
              <span className="tnum w-24 overflow-hidden text-center text-sm" aria-live="polite">
                <span key={partySize} className="digit-in">
                  {partySize}
                </span>{' '}
                {partySize === 1 ? 'traveler' : 'travelers'}
              </span>
              <button
                type="button"
                aria-label="More travelers"
                onClick={() => setPartySize((n) => Math.min(12, n + 1))}
                className="grid h-11 w-11 place-items-center text-sm transition-colors hover:bg-ink hover:text-paper"
              >
                +
              </button>
            </div>
            <label className="flex h-11 items-center border border-rule px-4 transition-colors focus-within:border-ink">
              <span className="mr-2 text-sm text-ink-soft">¥</span>
              <input
                type="number"
                min={0}
                step={10000}
                placeholder="No ceiling"
                aria-label="Total budget ceiling in yen, for the whole party"
                value={budgetCap ?? ''}
                onChange={(e) => setBudgetCap(e.target.value ? Number(e.target.value) : undefined)}
                className="tnum w-32 bg-transparent text-sm outline-none"
              />
            </label>
          </div>
          <p className="mt-3 text-xs text-ink-soft">
            Optional — set a total budget for the whole party and we'll flag it if the plan runs over.
          </p>
        </Field>
      </div>

      {/* The answers, issued as a ticket. Building the route punches it. */}
      <Reveal className="mt-20">
        <div className="ticket relative grid overflow-hidden md:grid-cols-[1fr_auto_auto]">
          <div className="relative p-6 md:p-8">
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-display text-2xl font-bold">
                乗車券
                <span className="tnum ml-3 align-middle text-[10px] font-normal uppercase tracking-[0.24em] text-ink-soft">
                  Boarding pass
                </span>
              </p>
              <p className="tnum text-[10px] tracking-[0.14em] text-ink-soft">No. {serial}</p>
            </div>

            <div className="mt-7 grid grid-cols-2 items-center gap-4 md:grid-cols-[auto_1fr_auto] md:gap-6">
              <div>
                <p className="tnum text-[9px] uppercase tracking-[0.24em] text-ink-soft">From</p>
                <p className="font-display text-2xl font-bold leading-tight md:text-3xl">{home.label}</p>
                <p className="font-display text-xs text-ink-soft">{home.ja}</p>
              </div>
              <RoutePreview stops={preview} className="order-last col-span-2 min-w-0 md:order-none md:col-span-1 md:pb-3" />
              <div className="text-right">
                <p className="tnum text-[9px] uppercase tracking-[0.24em] text-ink-soft">Return</p>
                <p className="font-display text-2xl font-bold leading-tight md:text-3xl">{home.label}</p>
                <p className="font-display text-xs text-ink-soft">{home.ja}</p>
              </div>
            </div>

            <dl className="mt-7 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-dashed border-rule pt-5 sm:grid-cols-4">
              {[
                ['Days', `${days}`],
                ['Party', `${partySize}`],
                ['Class', BUDGET_OPTIONS.find((b) => b.id === budget)!.label],
                ['When', month ? `${month.label.slice(0, 3)} ${travelYear ?? ''}`.trim() : 'Any time'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="tnum text-[9px] uppercase tracking-[0.24em] text-ink-soft">{k}</dt>
                  <dd className="tnum mt-1 text-sm">
                    <span key={v} className="digit-in">
                      {v}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="perforation" aria-hidden />

          <div className="relative flex items-center justify-center p-6 md:w-72 md:p-8">
            <button
              ref={buttonRef}
              onClick={submit}
              className="btn-sun inline-flex w-full items-center justify-center gap-3 px-4 py-5 text-sm uppercase tracking-[0.14em]"
            >
              {punched ? 'Departing' : 'Build the route'}
              <span className="arrow" aria-hidden>
                →
              </span>
            </button>
            {punched && <span className="punch-hole right-2 top-1/2 md:right-auto md:left-1/2 md:top-6" aria-hidden />}
          </div>

          {punched && (
            <div className="whoosh pointer-events-none absolute bottom-3 left-0 z-20" aria-hidden>
              <LongTrain />
            </div>
          )}
        </div>
      </Reveal>
    </section>
  )
}
