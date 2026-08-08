import type { Itinerary } from '../lib/itinerary'

export default function StatBand({ trip }: { trip: Itinerary }) {
  const stats = [
    { label: 'Days', value: String(trip.days.length) },
    { label: 'Stops', value: String(trip.stops.length) },
    { label: 'In transit', value: `${Math.round(trip.totalTravelHours)}h` },
    { label: 'Est. total', value: `¥${trip.cost.total.toLocaleString('en-US')}` },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 border-t border-rule">
      {stats.map((s) => (
        <div key={s.label} className="border-b border-r border-rule last:border-r-0 p-5 md:p-6">
          <div className="tnum text-[10px] tracking-[0.24em] uppercase text-ink-soft mb-3">{s.label}</div>
          <div className="tnum text-2xl md:text-[1.75rem] font-medium leading-none">{s.value}</div>
        </div>
      ))}
    </div>
  )
}
