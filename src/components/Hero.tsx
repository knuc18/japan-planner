import { Fragment } from 'react'
import { REGION_BY_ID, REGION_META } from '../data/regions'
import SakuraBranch from './SakuraBranch'
import Petals from './Petals'

const PREVIEW = ['tokyo', 'hakone', 'kanazawa', 'kyoto', 'nara', 'osaka', 'hiroshima'] as const

export default function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden grain">
      {/* The sun sits behind everything and is clipped by the route strip below,
          so the railway diagram reads as the horizon it rises over. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute right-[6%] bottom-[16%] translate-y-1/4">
          <div className="sun-rise relative">
            <div
              className="sun-glow absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: 'min(78vw, 660px)',
                height: 'min(78vw, 660px)',
                background:
                  'radial-gradient(circle, color-mix(in srgb, var(--color-sun) 55%, transparent) 0%, color-mix(in srgb, var(--color-sun) 14%, transparent) 42%, transparent 70%)',
              }}
            />
            <div
              className="relative rounded-full bg-sun"
              style={{ width: 'min(42vw, 340px)', height: 'min(42vw, 340px)' }}
            />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute -top-2 -left-6 w-[46%] max-w-[430px] opacity-95" aria-hidden>
        <SakuraBranch />
      </div>
      <div className="pointer-events-none absolute -top-6 -right-8 w-[34%] max-w-[320px] opacity-80" aria-hidden>
        <SakuraBranch flip />
      </div>

      <Petals />

      <div className="relative flex-1 flex items-center">
        <div className="w-full max-w-6xl mx-auto px-6 pt-32 pb-20">
          <p
            className="rise tnum text-[11px] tracking-[0.42em] text-ink-soft mb-8 uppercase"
            style={{ '--i': 0 } as React.CSSProperties}
          >
            路線案内 — Route Planner
          </p>

          <h1
            className="rise font-display font-extrabold text-[clamp(2.5rem,7.5vw,5.75rem)] leading-[0.95] tracking-[-0.025em]"
            style={{ '--i': 1 } as React.CSSProperties}
          >
            How far can
            <br />
            your days
            <br />
            take you?
          </h1>

          <p
            className="rise mt-8 text-lg text-ink-soft max-w-md leading-relaxed"
            style={{ '--i': 2 } as React.CSSProperties}
          >
            Three days keeps you near Tokyo. A month opens up Hokkaido. Tell us how long you
            have and what you love — we'll route the trains and count the yen.
          </p>

          <button
            onClick={onStart}
            className="rise group mt-10 inline-flex items-center gap-4 bg-sun text-white pl-7 pr-5 py-4 text-sm tracking-[0.16em] uppercase hover:gap-6 transition-[gap] duration-300"
            style={{ '--i': 3 } as React.CSSProperties}
          >
            Plan a route
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      {/* The horizon. Opaque, so it cuts the sun. */}
      <div className="relative z-10 border-t border-rule bg-paper">
        <div className="max-w-6xl mx-auto px-6 py-7">
          <p
            className="rise tnum text-[10px] tracking-[0.24em] uppercase text-ink-soft mb-6"
            style={{ '--i': 4 } as React.CSSProperties}
          >
            Example · 14 days · 7 stops
          </p>
          <div className="flex items-start">
            {PREVIEW.map((id, i) => {
              const meta = REGION_META[id]
              const region = REGION_BY_ID.get(id)!
              const nextId = PREVIEW[i + 1]
              return (
                <Fragment key={id}>
                  <div className="relative flex flex-col items-center shrink-0">
                    <span
                      className="rise block w-3.5 h-3.5 rounded-full border-[3px] bg-paper"
                      style={{ borderColor: meta.color, '--i': 6 + i * 1.6 } as React.CSSProperties}
                    />
                    <span
                      className="rise absolute top-6 flex flex-col items-center gap-0.5 whitespace-nowrap"
                      style={{ '--i': 6 + i * 1.6 } as React.CSSProperties}
                    >
                      <span className="tnum text-[10px] text-ink-soft">{meta.code}</span>
                      <span className="hidden sm:block text-[11px] text-ink-soft">
                        {region.name.split(' ')[0]}
                      </span>
                    </span>
                  </div>
                  {nextId && (
                    <div
                      className="line-ink flex-1 h-[3px] mt-[5.5px] origin-left"
                      style={{
                        background: REGION_META[nextId].color,
                        transform: 'scaleX(0)',
                        animation: `grow 0.5s ease forwards ${700 + i * 170}ms`,
                      }}
                    />
                  )}
                </Fragment>
              )
            })}
          </div>
          <div className="h-11" />
        </div>
      </div>

      <style>{`@keyframes grow { to { transform: scaleX(1); } }`}</style>
    </section>
  )
}
