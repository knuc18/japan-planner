import type { CSSProperties } from 'react'
import type { Itinerary } from '../lib/itinerary'
import Ticker from './Ticker'

export default function StatBand({ trip }: { trip: Itinerary }) {
  const stats = [
    { label: 'Days', ja: '日数', value: String(trip.days.length) },
    { label: 'Stops', ja: '駅', value: String(trip.stops.length) },
    { label: 'In transit', ja: '移動', value: `${Math.round(trip.totalTravelHours)}h` },
    { label: 'Est. total', ja: '合計', value: `¥${trip.cost.total.toLocaleString('en-US')}` },
  ]

  return (
    <div className="relative">
      <span className="rule-draw absolute inset-x-0 top-0 h-px bg-rule" aria-hidden />
      <div className="stagger grid grid-cols-2 md:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="group relative border-b border-r border-rule p-5 last:border-r-0 max-md:even:border-r-0 md:p-6"
            style={{ '--i': i } as CSSProperties}
          >
            <div className="mb-3 flex items-baseline justify-between">
              <span className="tnum text-[10px] uppercase tracking-[0.24em] text-ink-soft">{s.label}</span>
              <span className="font-display text-xs text-ink-soft/70">{s.ja}</span>
            </div>
            <Ticker value={s.value} className="tnum block text-2xl font-medium leading-none md:text-[2rem]" />
            <span
              aria-hidden
              className="absolute bottom-[-1px] left-0 h-[2px] w-full origin-left scale-x-0 bg-sun transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
