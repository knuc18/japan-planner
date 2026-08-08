import type { Itinerary } from '../lib/itinerary'

const SEGMENTS: { key: 'lodging' | 'transport' | 'food' | 'activities'; label: string; color: string }[] = [
  { key: 'lodging', label: 'Lodging', color: 'var(--color-ink)' },
  { key: 'transport', label: 'Transport', color: '#0b5fa5' },
  { key: 'food', label: 'Food', color: '#c25e12' },
  { key: 'activities', label: 'Activities', color: '#0e7c86' },
]

export default function CostBreakdown({ trip }: { trip: Itinerary }) {
  const total = trip.cost.total || 1
  const perDay = Math.round(trip.cost.total / Math.max(1, trip.days.length))

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
          Roughly <span className="tnum text-ink">¥{perDay.toLocaleString('en-US')}</span> a day, all in.
        </p>
        <p className="text-xs text-ink-soft max-w-md">
          Estimates only — 2026 fares and typical rates, not live pricing. Actual costs move with
          season and booking window.
        </p>
      </div>
    </div>
  )
}
