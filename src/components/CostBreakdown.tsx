import { useState, type CSSProperties } from 'react'
import type { Itinerary } from '../lib/itinerary'
import { useInView } from '../lib/motion'
import Ticker from './Ticker'

const SEGMENTS: { key: 'lodging' | 'transport' | 'food' | 'activities'; label: string; ja: string; color: string }[] = [
  { key: 'lodging', label: 'Lodging', ja: '宿', color: 'var(--color-lodging)' },
  { key: 'transport', label: 'Transport', ja: '交通', color: '#0b5fa5' },
  { key: 'food', label: 'Food', ja: '食', color: '#c25e12' },
  { key: 'activities', label: 'Activities', ja: '体験', color: '#0e7c86' },
]

export default function CostBreakdown({
  trip,
  partySize = 1,
  budgetCap,
}: {
  trip: Itinerary
  partySize?: number
  budgetCap?: number
}) {
  const [ref, seen] = useInView<HTMLDivElement>()
  const [active, setActive] = useState<string | null>(null)
  const total = trip.cost.total || 1
  const perDay = Math.round(trip.cost.total / Math.max(1, trip.days.length))
  // ponytail: scales every segment by partySize uniformly — a fair estimate
  // for food/transport/activities (genuinely per-traveler), but overstates
  // lodging if the party shares rooms. Flagged, not modeled: room-sharing
  // would need a rooms-per-tier assumption the data doesn't have yet.
  const partyTotal = trip.cost.total * partySize
  const overBudget = budgetCap != null && partyTotal > budgetCap

  return (
    <div ref={ref} onMouseLeave={() => setActive(null)}>
      {/* The bar fills in segment by segment, like a gauge. */}
      <div className="flex h-12 w-full overflow-hidden bg-rule/40">
        {SEGMENTS.map((seg, i) => {
          const pct = Math.round((trip.cost[seg.key] / total) * 100)
          return (
            <div
              key={seg.key}
              className="cost-seg relative flex items-center overflow-hidden transition-[flex-grow,opacity] duration-700 ease-[cubic-bezier(0.76,0,0.24,1)]"
              style={{
                flexGrow: trip.cost[seg.key],
                flexBasis: 0,
                opacity: active && active !== seg.key ? 0.3 : 1,
              }}
              onMouseEnter={() => setActive(seg.key)}
              title={`${seg.label}: ¥${trip.cost[seg.key].toLocaleString('en-US')}`}
            >
              <span
                aria-hidden
                className="bar-fill absolute inset-0 origin-left transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)]"
                style={{
                  background: seg.color,
                  transform: seen ? 'scaleX(1)' : 'scaleX(0)',
                  transitionDelay: `${i * 380}ms`,
                }}
              />
              {pct >= 9 && (
                <span
                  className="tnum relative whitespace-nowrap px-3 text-[10px] tracking-[0.12em] text-white transition-opacity duration-500"
                  style={{ opacity: seen ? 1 : 0, transitionDelay: `${i * 380 + 500}ms` }}
                >
                  {pct}%
                </span>
              )}
            </div>
          )
        })}
      </div>

      <dl className="stagger grid grid-cols-2 border-b border-rule md:grid-cols-4">
        {SEGMENTS.map((seg, i) => (
          <div
            key={seg.key}
            onMouseEnter={() => setActive(seg.key)}
            className={`cost-seg relative border-r border-rule p-5 transition-[background-color,opacity] duration-300 last:border-r-0 max-md:even:border-r-0 ${
              active === seg.key ? 'bg-paper-2' : ''
            } ${active && active !== seg.key ? 'opacity-50' : ''}`}
            style={{ '--i': i + 2 } as CSSProperties}
          >
            <span
              aria-hidden
              className="absolute left-0 top-0 h-[3px] transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ background: seg.color, width: active === seg.key ? '100%' : '24px' }}
            />
            <dt className="tnum mb-2 flex items-baseline justify-between text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              {seg.label}
              <span className="font-display text-xs normal-case tracking-normal text-ink-soft/70">{seg.ja}</span>
            </dt>
            <dd>
              <Ticker value={`¥${trip.cost[seg.key].toLocaleString('en-US')}`} className="tnum text-xl font-medium" />
            </dd>
            <dd className="tnum mt-1 text-[11px] text-ink-soft">
              {Math.round((trip.cost[seg.key] / total) * 100)}%
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-baseline justify-between gap-4 pt-5">
        <p className="text-sm text-ink-soft">
          Roughly <span className="tnum text-ink">¥{perDay.toLocaleString('en-US')}</span> a day, per
          traveler.
        </p>
        <p className="max-w-md text-xs text-ink-soft">
          Estimates only — 2026 fares and typical rates, not live pricing. Actual costs move with
          season and booking window.
        </p>
      </div>

      {partySize > 1 && (
        <div
          className={`mt-5 border-l-[3px] p-5 ${overBudget ? 'border-sun bg-sun/10' : 'border-rule bg-paper-2'}`}
        >
          <p className="text-sm">
            <span className="tnum font-medium text-ink">¥{partyTotal.toLocaleString('en-US')}</span>{' '}
            total for {partySize} travelers
            {budgetCap != null && (
              <>
                , against a{' '}
                <span className="tnum">¥{budgetCap.toLocaleString('en-US')}</span> ceiling
              </>
            )}
            .
          </p>
          {overBudget && (
            <p className="mt-1 text-sm text-ink-soft">
              That's{' '}
              <span className="tnum text-ink">¥{(partyTotal - budgetCap!).toLocaleString('en-US')}</span>{' '}
              over — trim nights, drop a stop, or step down a budget tier.
            </p>
          )}
          <p className="mt-2 text-xs text-ink-soft">
            Assumes separate lodging per traveler — sharing rooms costs less than this shows.
          </p>
        </div>
      )}

      {partySize === 1 && overBudget && (
        <div className="mt-5 border-l-[3px] border-sun bg-sun/10 p-5">
          <p className="text-sm">
            <span className="tnum font-medium text-ink">¥{partyTotal.toLocaleString('en-US')}</span> is{' '}
            <span className="tnum text-ink">¥{(partyTotal - budgetCap!).toLocaleString('en-US')}</span>{' '}
            over your ¥{budgetCap!.toLocaleString('en-US')} ceiling — trim nights, drop a stop, or step
            down a budget tier.
          </p>
        </div>
      )}
    </div>
  )
}
