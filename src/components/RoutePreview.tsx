import { Fragment, type CSSProperties } from 'react'
import type { RouteStop } from '../lib/itinerary'
import { REGION_META } from '../data/regions'

/**
 * A miniature route line. Keyed by region, so as the answers change only the
 * stations that are new pop in, and only the new track segments draw.
 */
export default function RoutePreview({ stops, className = '' }: { stops: RouteStop[]; className?: string }) {
  return (
    <div
      role="img"
      aria-label={`Route so far: ${stops.map((s) => `${s.region.name}, ${s.days} ${s.days === 1 ? 'night' : 'nights'}`).join('; ')}`}
      className={`flex items-start ${className}`}
    >
      {stops.map((s, i) => {
        const meta = REGION_META[s.region.id]
        const next = stops[i + 1]
        return (
          <Fragment key={s.region.id}>
            <div className="pop-in flex shrink-0 flex-col items-center" title={s.region.name}>
              <span
                className="tnum grid h-7 w-7 place-items-center rounded-full text-[9px] font-semibold text-white shadow-[0_0_0_3px_var(--color-paper)]"
                style={{ background: meta.color }}
              >
                {meta.code}
              </span>
              <span key={s.days} className="digit-in tnum mt-1 text-[9px] text-ink-soft">
                {s.days}n
              </span>
            </div>
            {next && (
              <div
                key={`${s.region.id}-${next.region.id}`}
                className="line-ink grow-x mt-[12.5px] h-[3px] min-w-2 flex-1"
                style={{ background: REGION_META[next.region.id].color, '--delay': '80ms' } as CSSProperties}
              />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
