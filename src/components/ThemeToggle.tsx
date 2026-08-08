import { useEffect, useState } from 'react'
import { applyTheme, readTheme, type Theme } from '../lib/theme'

const OPTIONS: { id: Theme; ja: string; label: string }[] = [
  { id: 'light', ja: '昼', label: 'Day' },
  { id: 'dark', ja: '夜', label: 'Night' },
]

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => readTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className="fixed top-4 right-4 z-50 flex border border-rule bg-paper/85 backdrop-blur-sm"
    >
      {OPTIONS.map((opt) => {
        const active = theme === opt.id
        return (
          <button
            key={opt.id}
            onClick={() => setTheme(opt.id)}
            aria-pressed={active}
            title={`${opt.label} theme`}
            className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors duration-200 ${
              active ? 'bg-sun text-white' : 'text-ink-soft hover:text-ink'
            }`}
          >
            <span className="font-display text-sm leading-none">{opt.ja}</span>
            <span className="tnum text-[10px] tracking-[0.16em] uppercase">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
