import { useState, type MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import { applyTheme, readTheme, type Theme } from '../lib/theme'
import { prefersReducedMotion } from '../lib/motion'

const OPTIONS: { id: Theme; ja: string; label: string }[] = [
  { id: 'light', ja: '昼', label: 'Day' },
  { id: 'dark', ja: '夜', label: 'Night' },
]

function SunIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
      <circle cx="5" cy="5" r="4" fill="currentColor" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
      <path d="M6.8 0.6 A 4.4 4.4 0 1 0 9.4 7.2 A 3.6 3.6 0 1 1 6.8 0.6 Z" fill="currentColor" />
    </svg>
  )
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    const t = readTheme()
    applyTheme(t)
    return t
  })

  function choose(next: Theme, e: MouseEvent<HTMLButtonElement>) {
    if (next === theme) return
    const commit = () => {
      flushSync(() => setTheme(next))
      applyTheme(next)
    }

    // Night falls (or day breaks) as a circle spreading out from the toggle.
    // The sun and moon still run their own slower set/rise underneath it.
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> }
    }
    if (!doc.startViewTransition || prefersReducedMotion()) {
      commit()
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX || rect.left + rect.width / 2
    const y = e.clientY || rect.top + rect.height / 2
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    const vt = doc.startViewTransition(commit)
    vt.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 1100, easing: 'cubic-bezier(0.76, 0, 0.24, 1)', pseudoElement: '::view-transition-new(root)' },
        )
      })
      .catch(() => {})
  }

  const night = theme === 'dark'

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className="no-print fixed right-4 top-4 z-50 grid grid-cols-2 border border-rule bg-paper/75 p-1 backdrop-blur-md"
    >
      {/* The thumb is the sky body itself: red sun by day, pale moon by night. */}
      <span
        aria-hidden
        className="absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]"
        style={{
          transform: night ? 'translateX(100%)' : 'none',
          background: night ? 'var(--color-moon)' : 'var(--color-sun)',
        }}
      />
      {OPTIONS.map((opt) => {
        const active = theme === opt.id
        return (
          <button
            key={opt.id}
            onClick={(e) => choose(opt.id, e)}
            aria-pressed={active}
            title={`${opt.label} theme`}
            className={`relative flex items-center justify-center gap-2 px-3 py-1.5 text-xs transition-colors duration-500 ${
              active ? (night ? 'text-[#17151a]' : 'text-white') : 'text-ink-soft hover:text-ink'
            }`}
          >
            {opt.id === 'light' ? <SunIcon /> : <MoonIcon />}
            <span className="font-display text-sm leading-none">{opt.ja}</span>
            <span className="tnum text-[10px] uppercase tracking-[0.16em]">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
