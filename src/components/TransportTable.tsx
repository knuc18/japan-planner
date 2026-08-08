import type { Itinerary } from '../lib/itinerary'
import { REGION_BY_ID } from '../data/regions'

const MODE_LABEL: Record<string, string> = {
  shinkansen: 'Shinkansen',
  'limited-express': 'Limited Express',
  'highway-bus': 'Highway Bus',
  flight: 'Flight',
  ferry: 'Ferry',
  'rental-car': 'Rental Car',
}

export default function TransportTable({ trip }: { trip: Itinerary }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[560px]">
        <thead>
          <tr className="border-b-2 border-sumi text-left uppercase text-xs tracking-widest text-stone">
            <th className="py-3 pr-4">Leg</th>
            <th className="py-3 pr-4">Mode</th>
            <th className="py-3 pr-4">Duration</th>
            <th className="py-3 pr-4">Cost</th>
            <th className="py-3">JR Pass</th>
          </tr>
        </thead>
        <tbody>
          {trip.legs.map((leg, i) => (
            <tr key={i} className="border-b border-sumi/10">
              <td className="py-3 pr-4">
                {REGION_BY_ID.get(leg.from)?.name} → {REGION_BY_ID.get(leg.to)?.name}
              </td>
              <td className="py-3 pr-4">{MODE_LABEL[leg.mode]}</td>
              <td className="py-3 pr-4">{leg.hours}h</td>
              <td className="py-3 pr-4">¥{leg.yen.toLocaleString('en-US')}</td>
              <td className="py-3">
                {leg.jrPassCovered ? (
                  <span className="text-indigo">✓ Covered</span>
                ) : (
                  <span className="text-stone">— Not covered</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 p-4 border-2 border-indigo/30 bg-indigo/5 text-sm">
        <p className="font-display text-base mb-1">
          {trip.jrPass.recommended ? 'Get the JR Pass' : 'Skip the JR Pass'}
        </p>
        <p className="text-stone">
          Your JR-covered travel comes to ¥{trip.jrPass.jrSpend.toLocaleString('en-US')}, against a ¥
          {trip.jrPass.passPrice.toLocaleString('en-US')} {trip.jrPass.passDays}-day Ordinary pass.{' '}
          {trip.jrPass.recommended
            ? `That's a ¥${trip.jrPass.savings.toLocaleString('en-US')} saving.`
            : `Paying per ticket saves you ¥${Math.abs(trip.jrPass.savings).toLocaleString('en-US')}.`}
        </p>
      </div>
    </div>
  )
}
