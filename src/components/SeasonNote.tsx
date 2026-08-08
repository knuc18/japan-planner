import { MONTH_BY_NUMBER, SEASON_META } from '../data/seasons'

export default function SeasonNote({ month, year }: { month?: number; year?: number }) {
  if (!month) return null
  const info = MONTH_BY_NUMBER.get(month)
  if (!info) return null
  const color = SEASON_META[info.season].color

  return (
    <div className="mt-4 flex gap-3 border-l-[3px] pl-4 py-1" style={{ borderColor: color }}>
      <span className="font-display text-xl leading-none pt-0.5" style={{ color }}>
        {info.seasonJa}
      </span>
      <div className="text-sm">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-medium">
            {info.label}
            {year ? ` ${year}` : ''} is {info.seasonLabel.toLowerCase()} in Japan.
          </span>
          <span className="tnum text-[11px] text-ink-soft">
            avg {info.avgLowC}–{info.avgHighC}°C
          </span>
        </p>
        <p className="text-ink-soft mt-1 leading-relaxed">{info.note}</p>
      </div>
    </div>
  )
}
