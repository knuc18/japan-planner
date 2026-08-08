import { Fragment } from 'react'
import { REGION_BY_ID, REGION_META } from '../data/regions'

const PREVIEW = ['tokyo', 'hakone', 'kanazawa', 'kyoto', 'nara', 'osaka', 'hiroshima'] as const

export default function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative min-h-screen flex flex-col grain">
      <div className="flex-1 flex items-center">
        <div className="w-full max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-[1fr_auto] gap-12 items-end">
          <div>
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
              className="rise group mt-10 inline-flex items-center gap-4 bg-ink text-paper pl-7 pr-5 py-4 text-sm tracking-[0.16em] uppercase hover:gap-6 transition-[gap] duration-300"
              style={{ '--i': 3 } as React.CSSProperties}
            >
              Plan a route
              <span aria-hidden>→</span>
            </button>
          </div>

          {/* Counterweight: the brief, set the way a station sign sets it. */}
          <p
            className="rise hidden md:block font-display text-base tracking-[0.4em] text-ink-soft self-center"
            style={{ writingMode: 'vertical-rl', '--i': 2 } as React.CSSProperties}
          >
            日本を、あなたの日数で。
          </p>
        </div>
      </div>

      {/* Route strip, pinned to the base of the hero like a platform diagram. */}
      <div className="border-t border-rule">
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
                      className="flex-1 h-[3px] mt-[5.5px] origin-left"
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
