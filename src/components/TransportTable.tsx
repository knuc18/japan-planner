import type { Itinerary } from '../lib/itinerary'
import { REGION_BY_ID, REGION_META } from '../data/regions'

const MODE_LABEL: Record<string, string> = {
  shinkansen: 'Shinkansen',
  'limited-express': 'Limited Express',
  'highway-bus': 'Highway Bus',
  flight: 'Flight',
  ferry: 'Ferry',
  'rental-car': 'Rental Car',
}

export default function TransportTable({ trip }: { trip: Itinerary }) {
  const { jrPass } = trip

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px] border-collapse">
          <thead>
            <tr className="border-y border-ink tnum text-[10px] tracking-[0.2em] uppercase text-ink-soft">
              <th className="text-left font-normal py-3 pr-4">Leg</th>
              <th className="text-left font-normal py-3 pr-4">Mode</th>
              <th className="text-right font-normal py-3 pr-4">Time</th>
              <th className="text-right font-normal py-3 pr-4">Fare</th>
              <th className="text-left font-normal py-3">Pass</th>
            </tr>
          </thead>
          <tbody>
            {trip.legs.map((leg, i) => {
              const color = REGION_META[leg.to]?.color
              return (
                <tr key={i} className="border-b border-rule group hover:bg-paper-2 transition-colors">
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-2.5">
                      <span
                        className="line-ink w-1 h-4 shrink-0 transition-all duration-200 group-hover:h-5"
                        style={{ background: color }}
                      />
                      {REGION_BY_ID.get(leg.from)?.name} → {REGION_BY_ID.get(leg.to)?.name}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-ink-soft">{MODE_LABEL[leg.mode]}</td>
                  <td className="py-3 pr-4 text-right tnum">{leg.hours}h</td>
                  <td className="py-3 pr-4 text-right tnum">¥{leg.yen.toLocaleString('en-US')}</td>
                  <td className="py-3 tnum text-[11px]">
                    {leg.jrPassCovered ? (
                      <span className="text-indigo">✓ JR</span>
                    ) : (
                      <span className="text-ink-soft">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 border-l-[3px] border-indigo bg-paper-2 p-5">
        <p className="font-display font-bold text-xl mb-2">
          {jrPass.recommended ? 'Buy the JR Pass' : 'Skip the JR Pass'}
        </p>
        <p className="text-sm text-ink-soft leading-relaxed max-w-2xl">
          Your JR-covered travel comes to{' '}
          <span className="tnum text-ink">¥{jrPass.jrSpend.toLocaleString('en-US')}</span>, against a{' '}
          <span className="tnum text-ink">¥{jrPass.passPrice.toLocaleString('en-US')}</span>{' '}
          {jrPass.passDays}-day Ordinary pass.{' '}
          {jrPass.recommended
            ? `The pass saves you ¥${jrPass.savings.toLocaleString('en-US')}.`
            : `Buying tickets as you go saves you ¥${Math.abs(jrPass.savings).toLocaleString('en-US')}.`}
        </p>
      </div>
    </div>
  )
}
