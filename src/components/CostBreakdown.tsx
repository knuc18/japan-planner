import type { Itinerary } from '../lib/itinerary'

const SEGMENTS: { key: keyof Itinerary['cost']; label: string; color: string }[] = [
  { key: 'lodging', label: 'Lodging', color: 'var(--color-vermilion)' },
  { key: 'transport', label: 'Transport', color: 'var(--color-indigo)' },
  { key: 'food', label: 'Food', color: 'var(--color-gold)' },
  { key: 'activities', label: 'Activities', color: 'var(--color-stone)' },
]

export default function CostBreakdown({ trip }: { trip: Itinerary }) {
  const total = trip.cost.total || 1
  return (
    <div>
      <div className="flex h-8 w-full overflow-hidden border-2 border-sumi/20 mb-6">
        {SEGMENTS.map((seg) => (
          <div
            key={seg.key}
            style={{ width: `${(trip.cost[seg.key] / total) * 100}%`, background: seg.color }}
            title={seg.label}
          />
        ))}
      </div>
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {SEGMENTS.map((seg) => (
          <div key={seg.key}>
            <dt className="flex items-center gap-2 text-xs uppercase tracking-widest text-stone">
              <span className="inline-block w-2.5 h-2.5" style={{ background: seg.color }} />
              {seg.label}
            </dt>
            <dd className="font-display text-xl mt-1">¥{trip.cost[seg.key].toLocaleString('en-US')}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-xs text-stone">
        Estimates only — 2026 fares and typical rates, not live pricing. Actual costs vary by season and booking window.
      </p>
    </div>
  )
}
