import type { Itinerary } from '../lib/itinerary'

export default function Timeline({ trip }: { trip: Itinerary }) {
  return (
    <div className="space-y-6">
      {trip.days.map((day) => {
        const region = trip.stops.find((s) => s.region.id === day.regionId)?.region
        return (
          <div key={day.day} className="flex gap-4 md:gap-8 border-b border-sumi/10 pb-6">
            <div className="shrink-0 w-16 md:w-24 text-center">
              <div className="font-display text-2xl md:text-3xl">{day.day}</div>
              <div className="text-[10px] uppercase tracking-widest text-stone">Day</div>
            </div>
            <div className="flex-1">
              <p className="font-display text-lg mb-2">
                {region?.name} <span className="text-stone text-sm">{region?.nameJa}</span>
              </p>
              {day.activities.length === 0 ? (
                <p className="text-sm text-stone italic">Free day — wander, rest, or day-trip on your own.</p>
              ) : (
                <ul className="space-y-2">
                  {day.activities.map((a) => (
                    <li key={a.id} className="text-sm flex gap-2">
                      <span className="text-vermilion">›</span>
                      <span>
                        <strong className="font-medium">{a.name}</strong> — {a.blurb}{' '}
                        <span className="text-stone">
                          ({a.hours}h{a.yen > 0 ? `, ¥${a.yen.toLocaleString('en-US')}` : ', free'})
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
