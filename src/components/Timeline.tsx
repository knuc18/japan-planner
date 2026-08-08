import { Fragment } from 'react'
import type { Itinerary } from '../lib/itinerary'
import type { Leg } from '../data/transport'
import { REGION_META } from '../data/regions'
import Reveal from './Reveal'

const MODE_LABEL: Record<string, string> = {
  shinkansen: 'Shinkansen',
  'limited-express': 'Limited Express',
  'highway-bus': 'Highway Bus',
  flight: 'Flight',
  ferry: 'Ferry',
  'rental-car': 'Rental Car',
}

function Transfer({ legs, label }: { legs: Leg[]; label?: string }) {
  const hours = legs.reduce((s, l) => s + l.hours, 0)
  const yen = legs.reduce((s, l) => s + l.yen, 0)
  return (
    <div className="grid grid-cols-[3.5rem_1fr] md:grid-cols-[5rem_1fr] gap-x-5 md:gap-x-8">
      <div className="relative flex justify-center">
        {/* dashed gap in the rail = you're in transit */}
        <div
          className="w-[3px] h-full"
          style={{
            backgroundImage: 'linear-gradient(var(--color-rule) 55%, transparent 55%)',
            backgroundSize: '3px 11px',
          }}
        />
      </div>
      <div className="py-5 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-ink-soft">
        <span className="tnum text-[10px] tracking-[0.22em] uppercase">{label ?? 'Transfer'}</span>
        <span className="text-ink">{legs.map((l) => MODE_LABEL[l.mode]).join(' → ')}</span>
        <span className="tnum">{hours}h</span>
        <span className="tnum">¥{yen.toLocaleString('en-US')}</span>
        {legs.every((l) => l.jrPassCovered) && (
          <span className="tnum text-[10px] tracking-[0.14em] uppercase text-indigo">JR Pass</span>
        )}
      </div>
    </div>
  )
}

export default function Timeline({ trip }: { trip: Itinerary }) {
  let cursor = 0

  return (
    <div>
      {trip.stops.map((stop, i) => {
        const days = trip.days.slice(cursor, cursor + stop.days)
        cursor += stop.days
        const meta = REGION_META[stop.region.id]
        const transfer = trip.transfers[i] ?? []

        return (
          <Fragment key={stop.region.id}>
            {transfer.length > 0 && <Transfer legs={transfer} />}

            <Reveal>
              <div className="grid grid-cols-[3.5rem_1fr] md:grid-cols-[5rem_1fr] gap-x-5 md:gap-x-8">
                {/* rail column */}
                <div className="relative flex flex-col items-center">
                  <div
                    className="node-pop tnum relative z-10 w-11 h-11 md:w-12 md:h-12 rounded-full grid place-items-center text-[13px] font-semibold text-white"
                    style={{ background: meta.color }}
                  >
                    {meta.code}
                  </div>
                  <div
                    className="rail-fill line-ink w-[3px] flex-1 mt-1"
                    style={{ background: meta.color }}
                  />
                </div>

                {/* content */}
                <div className="pb-10">
                  <div className="flex items-baseline gap-3 flex-wrap mb-1">
                    <h4 className="font-display font-bold text-2xl md:text-3xl leading-none">
                      {stop.region.name}
                    </h4>
                    <span className="font-display text-lg text-ink-soft">{stop.region.nameJa}</span>
                    <span className="tnum text-[11px] tracking-[0.18em] uppercase text-ink-soft ml-auto">
                      {stop.days} {stop.days === 1 ? 'night' : 'nights'}
                    </span>
                  </div>
                  <p className="text-sm text-ink-soft max-w-xl mb-6">{stop.region.blurb}</p>

                  <div className="space-y-5">
                    {days.map((day) => (
                      <div key={day.day} className="grid grid-cols-[3rem_1fr] gap-4">
                        <div className="tnum text-[11px] text-ink-soft pt-1 tracking-[0.1em]">
                          D{String(day.day).padStart(2, '0')}
                        </div>
                        {day.activities.length === 0 ? (
                          <p className="text-sm text-ink-soft italic pt-0.5">
                            Open day — wander, rest, or day-trip on your own.
                          </p>
                        ) : (
                          <ul className="space-y-2.5">
                            {day.activities.map((a) => (
                              <li key={a.id} className="group flex gap-3 text-sm">
                                <span
                                  className="mt-[7px] w-1.5 h-1.5 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-150"
                                  style={{ background: meta.color }}
                                />
                                <span className="leading-relaxed">
                                  <span className="font-medium">{a.name}</span>
                                  <span className="text-ink-soft"> — {a.blurb} </span>
                                  <span className="tnum text-[11px] text-ink-soft whitespace-nowrap">
                                    {a.hours}h · {a.yen > 0 ? `¥${a.yen.toLocaleString('en-US')}` : 'free'}
                                  </span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </Fragment>
        )
      })}

      {trip.returnLegs.length > 0 && <Transfer legs={trip.returnLegs} label="Return" />}

      <div className="grid grid-cols-[3.5rem_1fr] md:grid-cols-[5rem_1fr] gap-x-5 md:gap-x-8">
        <div className="flex justify-center">
          <div className="w-3 h-3 rounded-full bg-ink" />
        </div>
        <p className="tnum text-[11px] tracking-[0.22em] uppercase text-ink-soft -mt-0.5">
          End of route
        </p>
      </div>
    </div>
  )
}
