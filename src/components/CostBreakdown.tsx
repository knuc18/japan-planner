import type { Itinerary } from '../lib/itinerary'

const SEGMENTS: { key: 'lodging' | 'transport' | 'food' | 'activities'; label: string; color: string }[] = [
  { key: 'lodging', label: 'Lodging', color: 'var(--color-ink)' },
  { key: 'transport', label: 'Transport', color: '#0b5fa5' },
  { key: 'food', label: 'Food', color: '#c25e12' },
  { key: 'activities', label: 'Activities', color: '#0e7c86' },
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
  const total = trip.cost.total || 1
  const perDay = Math.round(trip.cost.total / Math.max(1, trip.days.length))
  // ponytail: scales every segment by partySize uniformly — a fair estimate
  // for food/transport/activities (genuinely per-traveler), but overstates
  // lodging if the party shares rooms. Flagged, not modeled: room-sharing
  // would need a rooms-per-tier assumption the data doesn't have yet.
  const partyTotal = trip.cost.total * partySize
  const overBudget = budgetCap != null && partyTotal > budgetCap

  return (
    <div>
      <div className="flex h-10 w-full overflow-hidden">
        {SEGMENTS.map((seg) => (
          <div
            key={seg.key}
            className="transition-[flex-grow] duration-700 ease-out"
            style={{ flexGrow: trip.cost[seg.key], background: seg.color }}
            title={`${seg.label}: ¥${trip.cost[seg.key].toLocaleString('en-US')}`}
          />
        ))}
      </div>

      <dl className="grid grid-cols-2 md:grid-cols-4 border-b border-rule">
        {SEGMENTS.map((seg) => (
          <div key={seg.key} className="border-r border-rule last:border-r-0 p-5">
            <dt className="tnum text-[10px] tracking-[0.2em] uppercase text-ink-soft mb-2">{seg.label}</dt>
            <dd className="tnum text-xl font-medium">¥{trip.cost[seg.key].toLocaleString('en-US')}</dd>
            <dd className="tnum text-[11px] text-ink-soft mt-1">
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
        <p className="text-xs text-ink-soft max-w-md">
          Estimates only — 2026 fares and typical rates, not live pricing. Actual costs move with
          season and booking window.
        </p>
      </div>

      {partySize > 1 && (
        <div
          className={`mt-5 border-l-[3px] p-5 ${overBudget ? 'border-sun bg-sun/10' : 'border-rule bg-paper-2'}`}
        >
          <p className="text-sm">
            <span className="tnum text-ink font-medium">¥{partyTotal.toLocaleString('en-US')}</span>{' '}
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
            <p className="text-sm text-ink-soft mt-1">
              That's{' '}
              <span className="tnum text-ink">¥{(partyTotal - budgetCap!).toLocaleString('en-US')}</span>{' '}
              over — trim nights, drop a stop, or step down a budget tier.
            </p>
          )}
          <p className="text-xs text-ink-soft mt-2">
            Assumes separate lodging per traveler — sharing rooms costs less than this shows.
          </p>
        </div>
      )}

      {partySize === 1 && overBudget && (
        <div className="mt-5 border-l-[3px] border-sun bg-sun/10 p-5">
          <p className="text-sm">
            <span className="tnum text-ink font-medium">¥{partyTotal.toLocaleString('en-US')}</span> is{' '}
            <span className="tnum text-ink">¥{(partyTotal - budgetCap!).toLocaleString('en-US')}</span>{' '}
            over your ¥{budgetCap!.toLocaleString('en-US')} ceiling — trim nights, drop a stop, or step
            down a budget tier.
          </p>
        </div>
      )}
    </div>
  )
}
