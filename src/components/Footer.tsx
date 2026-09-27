import { useInView } from '../lib/motion'

/** The end of the line: the sun (or moon) settles on the horizon as you arrive. */
export default function Footer() {
  const [ref, seen] = useInView<HTMLElement>('0px 0px -5% 0px')

  return (
    <footer ref={ref} className="no-print relative z-[2] overflow-hidden border-t border-rule">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-12 pt-20 text-center">
        <div className="relative h-24 w-80 overflow-hidden" aria-hidden>
          <span
            className="footer-orb absolute left-[calc(50%-5rem)] top-4 h-40 w-40 rounded-full transition-transform duration-[2.2s] ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: seen ? 'translateY(0)' : 'translateY(55%)' }}
          />
        </div>
        <span className="block h-px w-full max-w-md bg-ink/30" aria-hidden />

        <p className="mt-10 font-display text-3xl font-bold md:text-4xl">良い旅を</p>
        <p className="tnum mt-2 text-[11px] uppercase tracking-[0.3em] text-ink-soft">Have a good journey</p>

        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="btn-line mt-10 px-5 py-2.5 text-xs uppercase tracking-[0.14em]"
        >
          ↑ Back to the start
        </button>

        <p className="tnum mt-12 text-[10px] uppercase tracking-[0.22em] text-ink-soft">
          Built for wandering · Fares are estimates, not bookings
        </p>
      </div>
    </footer>
  )
}
