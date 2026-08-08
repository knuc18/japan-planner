export type Interest =
  | 'food'
  | 'history'
  | 'nature'
  | 'pop-culture'
  | 'onsen'
  | 'nightlife'
  | 'art'
  | 'hiking'

export type Tier = 'budget' | 'mid' | 'luxury'

export interface Region {
  id: string
  name: string
  nameJa: string
  lat: number
  lng: number
  blurb: string
  minDays: number
  maxDays: number
  tags: Partial<Record<Interest, number>> // 0-1 relevance weight
  lodgingPerNight: Record<Tier, number> // yen
  foodPerDay: Record<Tier, number> // yen
}

// ponytail: coordinates are rough city-center approximations for SVG projection,
// not survey-grade — fine for a stylized route map, not for real navigation.
export const REGIONS: Region[] = [
  {
    id: 'tokyo',
    name: 'Tokyo',
    nameJa: '東京',
    lat: 35.6762,
    lng: 139.6503,
    blurb: 'Neon canyons, centuries-old shrines, and the best food density on Earth.',
    minDays: 2,
    maxDays: 10,
    tags: { 'pop-culture': 1, food: 0.9, nightlife: 0.9, art: 0.6, history: 0.4 },
    lodgingPerNight: { budget: 5500, mid: 14000, luxury: 38000 },
    foodPerDay: { budget: 3500, mid: 7000, luxury: 16000 },
  },
  {
    id: 'hakone',
    name: 'Hakone & Fuji',
    nameJa: '箱根・富士',
    lat: 35.2323,
    lng: 139.1069,
    blurb: 'Onsen towns with Mt. Fuji views, ropeways, and lake cruises.',
    minDays: 1,
    maxDays: 3,
    tags: { onsen: 1, nature: 0.8, hiking: 0.5 },
    lodgingPerNight: { budget: 7000, mid: 20000, luxury: 55000 },
    foodPerDay: { budget: 3000, mid: 6500, luxury: 14000 },
  },
  {
    id: 'kyoto',
    name: 'Kyoto',
    nameJa: '京都',
    lat: 35.0116,
    lng: 135.7681,
    blurb: 'A thousand temples, geisha alleys, and bamboo groves at dawn.',
    minDays: 2,
    maxDays: 6,
    tags: { history: 1, art: 0.7, food: 0.6, nature: 0.4 },
    lodgingPerNight: { budget: 5000, mid: 15000, luxury: 42000 },
    foodPerDay: { budget: 3200, mid: 6800, luxury: 15000 },
  },
  {
    id: 'osaka',
    name: 'Osaka',
    nameJa: '大阪',
    lat: 34.6937,
    lng: 135.5023,
    blurb: 'Street food capital, brash nightlife, and Japan’s friendliest slang.',
    minDays: 1,
    maxDays: 4,
    tags: { food: 1, nightlife: 0.8, 'pop-culture': 0.5 },
    lodgingPerNight: { budget: 4800, mid: 12500, luxury: 34000 },
    foodPerDay: { budget: 3800, mid: 7500, luxury: 16000 },
  },
  {
    id: 'nara',
    name: 'Nara',
    nameJa: '奈良',
    lat: 34.6851,
    lng: 135.8048,
    blurb: 'Bowing deer, a giant bronze Buddha, and the oldest wooden buildings on Earth.',
    minDays: 1,
    maxDays: 2,
    tags: { history: 0.9, nature: 0.5 },
    lodgingPerNight: { budget: 5000, mid: 13000, luxury: 32000 },
    foodPerDay: { budget: 3000, mid: 6000, luxury: 13000 },
  },
  {
    id: 'kanazawa',
    name: 'Kanazawa',
    nameJa: '金沢',
    lat: 36.5613,
    lng: 136.6562,
    blurb: 'A samurai-era garden city on the Sea of Japan, famous for gold leaf and seafood.',
    minDays: 1,
    maxDays: 3,
    tags: { history: 0.7, art: 0.7, food: 0.6 },
    lodgingPerNight: { budget: 5200, mid: 13500, luxury: 33000 },
    foodPerDay: { budget: 3200, mid: 6800, luxury: 14000 },
  },
  {
    id: 'hiroshima',
    name: 'Hiroshima & Miyajima',
    nameJa: '広島・宮島',
    lat: 34.3853,
    lng: 132.4553,
    blurb: 'A peace memorial that stops you cold, and a floating torii gate at sunset.',
    minDays: 1,
    maxDays: 3,
    tags: { history: 1, nature: 0.5, food: 0.4 },
    lodgingPerNight: { budget: 4800, mid: 12000, luxury: 30000 },
    foodPerDay: { budget: 3000, mid: 6200, luxury: 13000 },
  },
  {
    id: 'hokkaido',
    name: 'Hokkaido',
    nameJa: '北海道',
    lat: 43.0642,
    lng: 141.3469,
    blurb: 'Wild north: powder snow, lavender fields, and the country’s best dairy and seafood.',
    minDays: 3,
    maxDays: 8,
    tags: { nature: 1, hiking: 0.9, onsen: 0.7, food: 0.6 },
    lodgingPerNight: { budget: 5500, mid: 14500, luxury: 40000 },
    foodPerDay: { budget: 3500, mid: 7200, luxury: 15000 },
  },
]

export const REGION_BY_ID = new Map(REGIONS.map((r) => [r.id, r]))

// Each region gets a station code and a line colour, the way a Japanese rail
// map codes every line. The colour is carried through the map, the route rail,
// and the transport table so one region always reads as one colour.
export const REGION_META: Record<string, { code: string; color: string }> = {
  tokyo: { code: 'TY', color: '#c8102e' },
  hakone: { code: 'HK', color: '#c25e12' },
  kyoto: { code: 'KY', color: '#6e2e8f' },
  osaka: { code: 'OS', color: '#0a7d3c' },
  nara: { code: 'NR', color: '#8f6a15' },
  kanazawa: { code: 'KZ', color: '#0b5fa5' },
  hiroshima: { code: 'HR', color: '#0e7c86' },
  hokkaido: { code: 'HD', color: '#4b4fa6' },
}
