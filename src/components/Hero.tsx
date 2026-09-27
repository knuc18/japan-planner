import { Fragment, useEffect, useRef, type CSSProperties } from 'react'
import { REGION_BY_ID, REGION_META } from '../data/regions'
import { prefersReducedMotion } from '../lib/motion'
import SakuraBranch from './SakuraBranch'
import Sky from './Sky'
import Hanko from './Hanko'

const PREVIEW = ['tokyo', 'hakone', 'kanazawa', 'kyoto', 'nara', 'osaka', 'hiroshima'] as const

// The example train stops at every station: a short run, a dwell, repeat.
const RUN = 1.5
const DWELL = 0.9
const TRAIN_START = 2.6
const LAST = PREVIEW.length - 1
const ARRIVE = (k: number) => k * (RUN + DWELL)
const LOOP = ARRIVE(LAST) + DWELL + 1.4

function trainKeyframes() {
  const pct = (t: number) => `${((t / LOOP) * 100).toFixed(3)}%`
  const frames = [`0% { left: 0%; opacity: 0; }`, `${pct(0.35)} { left: 0%; opacity: 1; }`]
  for (let k = 0; k < LAST; k++) {
    const depart = ARRIVE(k) + DWELL
    frames.push(
      `${pct(depart)} { left: ${(k / LAST) * 100}%; opacity: 1; animation-timing-function: cubic-bezier(.55,0,.3,1); }`,
    )
    frames.push(`${pct(ARRIVE(k + 1))} { left: ${((k + 1) / LAST) * 100}%; opacity: 1; }`)
  }
  frames.push(`${pct(ARRIVE(LAST) + DWELL)} { left: 100%; opacity: 1; }`)
  frames.push(`${pct(ARRIVE(LAST) + DWELL + 0.5)} { left: 100%; opacity: 0; }`)
  frames.push(`100% { left: 100%; opacity: 0; }`)
  return `@keyframes example-train { ${frames.join(' ')} }`
}

const TRAIN_CSS = trainKeyframes()

/** A tiny shinkansen in profile, nose to the right. */
function Train() {
  return (
    <svg width="34" height="11" viewBox="0 0 34 11" className="block">
      <path d="M1 2.5 H 21 C 27 2.5, 31.5 5.5, 33 9 V 10 H 1 Z" fill="var(--color-ink)" />
      <rect x="3" y="4.2" width="17" height="1.6" rx="0.8" fill="var(--color-paper)" opacity="0.9" />
      <rect x="1" y="8" width="30" height="1" fill="var(--color-sun)" />
    </svg>
  )
}

function useHeroMotion(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    let raf = 0
    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0

    let written = ''
    const tick = () => {
      raf = 0
      cx += (tx - cx) * 0.06
      cy += (ty - cy) * 0.06
      const sy = Math.min(window.scrollY, window.innerHeight * 1.4)
      // Once the hero is scrolled away these stop changing; skip the restyle.
      const next = `${sy.toFixed(1)}|${cx.toFixed(4)}|${cy.toFixed(4)}`
      if (next !== written) {
        written = next
        el.style.setProperty('--sy', sy.toFixed(1))
        el.style.setProperty('--px', cx.toFixed(4))
        el.style.setProperty('--py', cy.toFixed(4))
      }
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) raf = requestAnimationFrame(tick)
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || window.scrollY > window.innerHeight) return
      tx = (e.clientX / window.innerWidth) * 2 - 1
      ty = (e.clientY / window.innerHeight) * 2 - 1
      kick()
    }

    kick()
    window.addEventListener('scroll', kick, { passive: true })
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', kick)
      window.removeEventListener('pointermove', onMove)
    }
  }, [ref])
}

const HEADLINE = ['How far can', 'your days', 'take you?']

export default function Hero({ onStart }: { onStart: () => void }) {
  const ref = useRef<HTMLElement>(null)
  useHeroMotion(ref)

  return (
    <section ref={ref} className="relative flex min-h-[100svh] flex-col">
      <style>{TRAIN_CSS}</style>

      <div className="grain relative flex flex-1 items-center overflow-hidden">
        <Sky />

        {/* Branches frame the top corners and shake petals loose when brushed. */}
        <div
          className="depth pointer-events-none absolute -left-6 -top-4 z-[2] w-[58%] max-w-[400px] sm:w-[42%]"
          style={{ '--k': -0.12, '--dx': 14, '--dy': 8 } as CSSProperties}
          aria-hidden
        >
          <SakuraBranch />
        </div>
        <div
          className="depth pointer-events-none absolute -right-8 -top-6 z-[2] w-[40%] max-w-[330px] opacity-90 sm:w-[32%]"
          style={{ '--k': -0.08, '--dx': 10, '--dy': 6 } as CSSProperties}
          aria-hidden
        >
          <div style={{ transform: 'scaleX(-1)' }}>
            <SakuraBranch baseDelay={250} />
          </div>
        </div>

        {/* Vertical line of Japanese, the way a poster would set it. */}
        <div
          className="rise pointer-events-none absolute left-8 top-1/2 z-[2] hidden -translate-y-1/2 flex-col items-center gap-5 xl:flex"
          style={{ '--i': 9 } as CSSProperties}
          aria-hidden
        >
          <span className="h-16 w-px bg-ink/20" />
          <span className="font-display text-sm tracking-[0.5em] text-ink-soft [writing-mode:vertical-rl]">
            どこまで行ける？
          </span>
          <span className="h-16 w-px bg-ink/20" />
        </div>

        <div
          className="relative z-[2] w-full"
          style={{
            opacity: 'clamp(0, calc(1 - var(--sy, 0) / 620), 1)',
            transform: 'translate3d(0, calc(var(--sy, 0) * 0.18px), 0)',
          }}
        >
          <div className="mx-auto w-full max-w-6xl px-6 pb-24 pt-32 sm:pb-28 md:pt-40">
            <p
              className="rise tnum mb-8 text-[11px] uppercase tracking-[0.42em] text-ink-soft"
              style={{ '--i': 0 } as CSSProperties}
            >
              路線案内 — Route Planner
            </p>

            <h1 className="font-display text-[clamp(2.6rem,7.6vw,6rem)] font-extrabold leading-[0.95] tracking-[-0.025em]">
              {HEADLINE.map((line, i) => (
                <span key={line} className="line-mask" style={{ '--i': i } as CSSProperties}>
                  <span>
                    {i === 0 ? (
                      <>
                        How{' '}
                        <span className="relative inline-block">
                          far
                          <svg
                            className="brush pointer-events-none absolute -bottom-[0.1em] -left-[6%] -z-10 h-[0.24em] w-[112%]"
                            viewBox="0 0 200 26"
                            preserveAspectRatio="none"
                            aria-hidden
                          >
                            <path
                              d="M3 15 C 30 9, 90 5, 150 6 C 172 6, 190 7, 198 10 C 190 14, 168 15, 140 16 C 100 18, 50 21, 20 22 C 10 22, 4 20, 3 15 Z"
                              fill="var(--color-sun)"
                              opacity="0.92"
                            />
                          </svg>
                        </span>{' '}
                        can
                      </>
                    ) : i === HEADLINE.length - 1 ? (
                      <>
                        {line}
                        <Hanko
                          char="旅"
                          className="ml-[0.18em] inline-block h-[0.46em] w-[0.46em] align-[0.35em]"
                          delay={1500}
                          tilt={-7}
                        />
                      </>
                    ) : (
                      line
                    )}
                  </span>
                </span>
              ))}
            </h1>

            <p
              className="rise mt-8 max-w-md text-lg leading-relaxed text-ink-soft"
              style={{ '--i': 6 } as CSSProperties}
            >
              Three days keeps you near Tokyo. A month opens up Hokkaido. Tell us how long you
              have and what you love — we'll route the trains and count the yen.
            </p>

            <div className="rise mt-10 flex flex-wrap items-center gap-6" style={{ '--i': 7 } as CSSProperties}>
              <button
                onClick={onStart}
                className="btn-sun inline-flex items-center gap-4 py-4 pl-7 pr-6 text-sm uppercase tracking-[0.16em]"
              >
                Plan a route
                <span className="arrow" aria-hidden>
                  →
                </span>
              </button>
              <span className="tnum text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                7 questions · about a minute
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* The horizon. Opaque, so the sun and hills sink behind it. */}
      <div className="relative z-[3] border-t border-rule bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-7">
          <div className="mb-6 flex items-baseline justify-between gap-4">
            <p
              className="rise tnum text-[10px] uppercase tracking-[0.24em] text-ink-soft"
              style={{ '--i': 8 } as CSSProperties}
            >
              Example · 14 days · 7 stops
            </p>
            <p
              className="rise tnum hidden text-[10px] uppercase tracking-[0.24em] text-ink-soft sm:block"
              style={{ '--i': 9 } as CSSProperties}
            >
              <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-sun align-middle" />
              Now running · Tokyo → Hiroshima
            </p>
          </div>

          <div className="relative flex items-start">
            {/* The train rides a track spanning first to last station centre. */}
            <div
              className="moving-train pointer-events-none absolute left-[7px] right-[7px] top-[5.5px] z-10 h-[3px]"
              aria-hidden
            >
              <div
                className="absolute bottom-full -translate-x-1/2"
                style={{ animation: `example-train ${LOOP}s linear ${TRAIN_START}s infinite both` }}
              >
                <Train />
              </div>
            </div>

            {PREVIEW.map((id, i) => {
              const meta = REGION_META[id]
              const region = REGION_BY_ID.get(id)!
              const nextId = PREVIEW[i + 1]
              return (
                <Fragment key={id}>
                  <div className="group relative flex shrink-0 flex-col items-center">
                    <span
                      className="rise relative block h-3.5 w-3.5 rounded-full border-[3px] bg-paper transition-transform duration-300 group-hover:scale-125"
                      style={{ borderColor: meta.color, color: meta.color, '--i': 9 + i * 1.3 } as CSSProperties}
                    >
                      <span
                        className="station-pulse moving-train"
                        style={{
                          animation: `station-pulse ${LOOP}s ease-out ${TRAIN_START + ARRIVE(i)}s infinite both`,
                        }}
                      />
                    </span>
                    <span
                      className="rise absolute top-6 flex flex-col items-center gap-0.5 whitespace-nowrap"
                      style={{ '--i': 9 + i * 1.3 } as CSSProperties}
                    >
                      <span className="tnum text-[10px] text-ink-soft transition-colors group-hover:text-ink">
                        {meta.code}
                      </span>
                      <span className="hidden text-[11px] text-ink-soft sm:block">
                        <span className="group-hover:hidden">{region.name.split(' ')[0]}</span>
                        <span className="hidden font-display text-ink group-hover:inline">
                          {region.nameJa.split('・')[0]}
                        </span>
                      </span>
                    </span>
                  </div>
                  {nextId && (
                    <div
                      className="line-ink grow-x mt-[5.5px] h-[3px] flex-1"
                      style={
                        {
                          background: REGION_META[nextId].color,
                          '--delay': `${900 + i * 170}ms`,
                        } as CSSProperties
                      }
                    />
                  )}
                </Fragment>
              )
            })}
          </div>
          <div className="h-11" />
        </div>
      </div>
    </section>
  )
}
