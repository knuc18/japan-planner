import type { CSSProperties } from 'react'
import type { Itinerary } from '../lib/itinerary'
import { REGION_BY_ID, REGION_META } from '../data/regions'
import { useInView } from '../lib/motion'
import Hanko from './Hanko'

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
  const [verdictRef, verdictSeen] = useInView<HTMLDivElement>()
  const scale = Math.max(jrPass.jrSpend, jrPass.passPrice) || 1
  const bars = [
    { label: 'JR fares, bought as you go', value: jrPass.jrSpend, color: 'var(--color-ink)' },
    { label: `${jrPass.passDays}-day Ordinary pass`, value: jrPass.passPrice, color: 'var(--color-indigo)' },
  ]

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse text-sm">
          <thead>
            <tr className="tnum border-y border-ink text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              <th className="py-3 pr-4 text-left font-normal">Leg</th>
              <th className="py-3 pr-4 text-left font-normal">Mode</th>
              <th className="py-3 pr-4 text-right font-normal">Time</th>
              <th className="py-3 pr-4 text-right font-normal">Fare</th>
              <th className="py-3 text-left font-normal">Pass</th>
            </tr>
          </thead>
          <tbody className="stagger">
            {trip.legs.map((leg, i) => {
              const color = REGION_META[leg.to]?.color
              return (
                <tr
                  key={i}
                  className="group border-b border-rule transition-colors hover:bg-paper-2"
                  style={{ '--i': i } as CSSProperties}
                >
                  <td className="py-3.5 pr-4">
                    <span className="inline-flex items-center gap-2.5">
                      <span
                        className="line-ink h-4 w-1 shrink-0 transition-all duration-300 group-hover:h-6 group-hover:w-1.5"
                        style={{ background: color }}
                      />
                      <span className="transition-transform duration-300 group-hover:translate-x-1">
                        {REGION_BY_ID.get(leg.from)?.name}
                        <span className="mx-1.5 text-ink-soft">→</span>
                        {REGION_BY_ID.get(leg.to)?.name}
                      </span>
                    </span>
                  </td>
                  <td className="py-3.5 pr-4 text-ink-soft">{MODE_LABEL[leg.mode]}</td>
                  <td className="tnum py-3.5 pr-4 text-right">{leg.hours}h</td>
                  <td className="tnum py-3.5 pr-4 text-right">¥{leg.yen.toLocaleString('en-US')}</td>
                  <td className="tnum py-3.5 text-[11px]">
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

      <div
        ref={verdictRef}
        className="relative mt-10 overflow-hidden border-l-[3px] border-indigo bg-paper-2 p-6 pr-28 md:pr-40"
      >
        <p className="mb-2 font-display text-2xl font-bold">
          {jrPass.recommended ? 'Buy the JR Pass' : 'Skip the JR Pass'}
        </p>
        <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
          Your JR-covered travel comes to{' '}
          <span className="tnum text-ink">¥{jrPass.jrSpend.toLocaleString('en-US')}</span>, against a{' '}
          <span className="tnum text-ink">¥{jrPass.passPrice.toLocaleString('en-US')}</span>{' '}
          {jrPass.passDays}-day Ordinary pass.{' '}
          {jrPass.recommended
            ? `The pass saves you ¥${jrPass.savings.toLocaleString('en-US')}.`
            : `Buying tickets as you go saves you ¥${Math.abs(jrPass.savings).toLocaleString('en-US')}.`}
        </p>

        {/* The comparison, drawn: whichever bar is shorter wins. */}
        <div className="mt-5 max-w-xl space-y-2.5" aria-hidden>
          {bars.map((b, i) => (
            <div key={b.label} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1">
              <span className="tnum text-[10px] uppercase tracking-[0.16em] text-ink-soft">{b.label}</span>
              <span className="tnum text-[11px]">¥{b.value.toLocaleString('en-US')}</span>
              <span className="col-span-2 block h-1.5 bg-rule/60">
                <span
                  className="bar-fill block h-full origin-left transition-transform duration-[1.2s] ease-[cubic-bezier(0.76,0,0.24,1)]"
                  style={{
                    width: `${(b.value / scale) * 100}%`,
                    background: b.color,
                    transform: verdictSeen ? 'scaleX(1)' : 'scaleX(0)',
                    transitionDelay: `${200 + i * 180}ms`,
                  }}
                />
              </span>
            </div>
          ))}
        </div>

        {/* The verdict, stamped. 得 = a good deal; 否 = no. */}
        <Hanko
          key={String(jrPass.recommended)}
          shape="round"
          char={jrPass.recommended ? '得' : '否'}
          caption={jrPass.recommended ? 'WORTH IT' : 'SKIP IT'}
          className="absolute right-4 top-1/2 -mt-12 block h-24 w-24 md:right-8 md:-mt-14 md:h-28 md:w-28"
          delay={700}
          tilt={jrPass.recommended ? -12 : 9}
        />
      </div>
    </div>
  )
}
