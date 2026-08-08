import type { Itinerary } from '../lib/itinerary'

function yen(n: number) {
  return `¥${n.toLocaleString('en-US')}`
}

export default function StatBand({ trip }: { trip: Itinerary }) {
  const stats = [
    { label: 'Days', value: trip.days.length },
    { label: 'Regions', value: trip.stops.length },
    { label: 'Travel time', value: `${Math.round(trip.totalTravelHours)}h` },
    { label: 'Est. total cost', value: yen(trip.cost.total) },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-sumi/15 border-2 border-sumi/15 mb-10">
      {stats.map((s) => (
        <div key={s.label} className="bg-washi p-6 text-center">
          <div className="font-display text-3xl md:text-4xl">{s.value}</div>
          <div className="text-xs uppercase tracking-[0.2em] text-stone mt-2">{s.label}</div>
        </div>
      ))}
    </div>
  )
}
