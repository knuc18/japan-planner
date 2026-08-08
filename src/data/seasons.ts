export type Season = 'winter' | 'spring' | 'summer' | 'autumn'

export interface MonthInfo {
  month: number
  label: string
  season: Season
  seasonLabel: string
  seasonJa: string
  avgHighC: number
  avgLowC: number
  note: string
}

// ponytail: one representative average per month for Honshu (Tokyo/Kyoto
// latitude), not a per-region forecast — Hokkaido runs colder and Okinawa
// runs warmer than these numbers everywhere. Good enough to set expectations,
// not a weather service.
export const MONTHS: MonthInfo[] = [
  { month: 1, label: 'January', season: 'winter', seasonLabel: 'Winter', seasonJa: '冬', avgHighC: 10, avgLowC: 1, note: 'Cold, dry, and clear — the best skies of the year and short ski-season queues.' },
  { month: 2, label: 'February', season: 'winter', seasonLabel: 'Winter', seasonJa: '冬', avgHighC: 10, avgLowC: 1, note: 'Still deep winter, but plum blossoms start opening before the sakura do.' },
  { month: 3, label: 'March', season: 'spring', seasonLabel: 'Spring', seasonJa: '春', avgHighC: 14, avgLowC: 5, note: 'Sakura season begins in the south — Tokyo and Kyoto typically bloom late March.' },
  { month: 4, label: 'April', season: 'spring', seasonLabel: 'Spring', seasonJa: '春', avgHighC: 19, avgLowC: 10, note: 'Peak cherry blossom for most of Honshu, mild days — the single most popular month to visit.' },
  { month: 5, label: 'May', season: 'spring', seasonLabel: 'Spring', seasonJa: '春', avgHighC: 23, avgLowC: 14, note: 'Comfortable and green, before the humidity — Golden Week (early May) means heavy domestic travel.' },
  { month: 6, label: 'June', season: 'summer', seasonLabel: 'Summer', seasonJa: '夏', avgHighC: 26, avgLowC: 18, note: 'Rainy season (tsuyu) across most of the country — pack a compact umbrella.' },
  { month: 7, label: 'July', season: 'summer', seasonLabel: 'Summer', seasonJa: '夏', avgHighC: 30, avgLowC: 22, note: 'Hot and humid once the rains break, with fireworks festivals (hanabi) most weekends.' },
  { month: 8, label: 'August', season: 'summer', seasonLabel: 'Summer', seasonJa: '夏', avgHighC: 31, avgLowC: 24, note: 'Peak heat and peak domestic holiday crowds around Obon (mid-month).' },
  { month: 9, label: 'September', season: 'autumn', seasonLabel: 'Autumn', seasonJa: '秋', avgHighC: 27, avgLowC: 20, note: 'Still warm and typhoon season is active — check forecasts before booking trains.' },
  { month: 10, label: 'October', season: 'autumn', seasonLabel: 'Autumn', seasonJa: '秋', avgHighC: 22, avgLowC: 14, note: 'Comfortable and dry, with autumn colour starting in the mountains and Hokkaido.' },
  { month: 11, label: 'November', season: 'autumn', seasonLabel: 'Autumn', seasonJa: '秋', avgHighC: 16, avgLowC: 8, note: 'Peak koyo (autumn foliage) across Kyoto and Honshu — book ryokan well ahead.' },
  { month: 12, label: 'December', season: 'winter', seasonLabel: 'Winter', seasonJa: '冬', avgHighC: 12, avgLowC: 3, note: 'Cold and clear, illuminations everywhere, ski resorts opening in the north.' },
]

export const MONTH_BY_NUMBER = new Map(MONTHS.map((m) => [m.month, m]))

export const SEASON_META: Record<Season, { color: string }> = {
  winter: { color: '#1b5faa' },
  spring: { color: '#d4708c' },
  summer: { color: '#0a7d3c' },
  autumn: { color: '#c25e12' },
}
