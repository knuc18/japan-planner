export type Mode = 'shinkansen' | 'limited-express' | 'highway-bus' | 'flight' | 'ferry' | 'rental-car'

export interface Leg {
  from: string
  to: string
  mode: Mode
  hours: number
  yen: number
  jrPassCovered: boolean
  note?: string
}

// ponytail: hand-curated 2026 fare/duration estimates for the fastest common
// route between each pair — not a live timetable API. Good enough to reason
// about "can I get there and back in N days", not for booking off of.
export const LEGS: Leg[] = [
  { from: 'tokyo', to: 'hakone', mode: 'limited-express', hours: 1.5, yen: 2500, jrPassCovered: true },
  { from: 'tokyo', to: 'kyoto', mode: 'shinkansen', hours: 2.3, yen: 14000, jrPassCovered: true, note: 'Nozomi is fastest but JR Pass covers Hikari/Kodama only' },
  { from: 'tokyo', to: 'osaka', mode: 'shinkansen', hours: 2.5, yen: 14500, jrPassCovered: true },
  { from: 'tokyo', to: 'kanazawa', mode: 'shinkansen', hours: 2.5, yen: 14000, jrPassCovered: true },
  { from: 'tokyo', to: 'hiroshima', mode: 'shinkansen', hours: 4, yen: 19000, jrPassCovered: true },
  { from: 'tokyo', to: 'hokkaido', mode: 'flight', hours: 1.5, yen: 18000, jrPassCovered: false, note: 'Shinkansen to Sapporo runs ~8hr; flight is standard' },
  { from: 'tokyo', to: 'nara', mode: 'shinkansen', hours: 2.8, yen: 14500, jrPassCovered: true, note: 'Via Kyoto, then local line' },

  { from: 'hakone', to: 'kyoto', mode: 'shinkansen', hours: 2.6, yen: 12500, jrPassCovered: true, note: 'Via Odawara' },
  { from: 'hakone', to: 'tokyo', mode: 'limited-express', hours: 1.5, yen: 2500, jrPassCovered: true },

  { from: 'kyoto', to: 'osaka', mode: 'limited-express', hours: 0.5, yen: 1500, jrPassCovered: true },
  { from: 'kyoto', to: 'nara', mode: 'limited-express', hours: 0.75, yen: 720, jrPassCovered: true },
  { from: 'kyoto', to: 'kanazawa', mode: 'limited-express', hours: 2.3, yen: 7500, jrPassCovered: true },
  { from: 'kyoto', to: 'hiroshima', mode: 'shinkansen', hours: 1.5, yen: 11000, jrPassCovered: true },
  { from: 'kyoto', to: 'tokyo', mode: 'shinkansen', hours: 2.3, yen: 14000, jrPassCovered: true },

  { from: 'osaka', to: 'nara', mode: 'limited-express', hours: 0.6, yen: 570, jrPassCovered: true },
  { from: 'osaka', to: 'hiroshima', mode: 'shinkansen', hours: 1.3, yen: 10500, jrPassCovered: true },
  { from: 'osaka', to: 'kanazawa', mode: 'limited-express', hours: 2.6, yen: 7700, jrPassCovered: true },
  { from: 'osaka', to: 'tokyo', mode: 'shinkansen', hours: 2.5, yen: 14500, jrPassCovered: true },

  { from: 'nara', to: 'kyoto', mode: 'limited-express', hours: 0.75, yen: 720, jrPassCovered: true },
  { from: 'nara', to: 'osaka', mode: 'limited-express', hours: 0.6, yen: 570, jrPassCovered: true },

  { from: 'kanazawa', to: 'kyoto', mode: 'limited-express', hours: 2.3, yen: 7500, jrPassCovered: true },
  { from: 'kanazawa', to: 'tokyo', mode: 'shinkansen', hours: 2.5, yen: 14000, jrPassCovered: true },
  { from: 'kanazawa', to: 'osaka', mode: 'limited-express', hours: 2.6, yen: 7700, jrPassCovered: true },

  { from: 'hiroshima', to: 'kyoto', mode: 'shinkansen', hours: 1.5, yen: 11000, jrPassCovered: true },
  { from: 'hiroshima', to: 'osaka', mode: 'shinkansen', hours: 1.3, yen: 10500, jrPassCovered: true },
  { from: 'hiroshima', to: 'tokyo', mode: 'shinkansen', hours: 4, yen: 19000, jrPassCovered: true },

  { from: 'hokkaido', to: 'tokyo', mode: 'flight', hours: 1.5, yen: 18000, jrPassCovered: false },
]

export function findLeg(fromId: string, toId: string): Leg | undefined {
  return LEGS.find((l) => l.from === fromId && l.to === toId)
}
