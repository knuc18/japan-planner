import { REGIONS, REGION_BY_ID, type Interest, type Tier, type Region } from '../data/regions'
import { ACTIVITIES_BY_REGION, type Activity } from '../data/activities'
import { LEGS, type Leg } from '../data/transport'

export type Pace = 'relaxed' | 'balanced' | 'packed'

export interface PlannerInput {
  days: number
  interests: Interest[]
  pace: Pace
  budget: Tier
  arrival: 'tokyo' | 'osaka'
}

export interface DayPlan {
  day: number
  regionId: string
  activities: Activity[]
}

export interface RouteStop {
  region: Region
  days: number
}

export interface CostBreakdown {
  transport: number
  lodging: number
  food: number
  activities: number
  total: number
}

export interface JrPassVerdict {
  recommended: boolean
  jrSpend: number
  passPrice: number
  passDays: 7 | 14 | 21
  savings: number
}

export interface Itinerary {
  stops: RouteStop[]
  legs: Leg[]
  days: DayPlan[]
  cost: CostBreakdown
  jrPass: JrPassVerdict
  totalTravelHours: number
}

const PACE_SLOTS: Record<Pace, number> = { relaxed: 2, balanced: 3, packed: 4 }
const JR_PASS_PRICE: Record<7 | 14 | 21, number> = { 7: 50000, 14: 80000, 21: 100000 }

function edge(a: string, b: string): Leg | undefined {
  const direct = LEGS.find((l) => l.from === a && l.to === b)
  if (direct) return direct
  const reverse = LEGS.find((l) => l.from === b && l.to === a)
  return reverse ? { ...reverse, from: a, to: b } : undefined
}

// Floyd-Warshall over the 8-region graph so any pair has a travel-time
// estimate even without a direct leg (e.g. Nara -> Kanazawa routes via Kyoto).
// ponytail: fine at 8 nodes; would need a real graph lib well past ~50 nodes.
function buildAllPairs() {
  const ids = REGIONS.map((r) => r.id)
  const dist = new Map<string, Map<string, number>>()
  const next = new Map<string, Map<string, string>>()
  for (const i of ids) {
    dist.set(i, new Map())
    next.set(i, new Map())
    for (const j of ids) {
      if (i === j) {
        dist.get(i)!.set(j, 0)
        continue
      }
      const e = edge(i, j)
      dist.get(i)!.set(j, e ? e.hours : Infinity)
      if (e) next.get(i)!.set(j, j)
    }
  }
  for (const k of ids) {
    for (const i of ids) {
      for (const j of ids) {
        const dik = dist.get(i)!.get(k)!
        const dkj = dist.get(k)!.get(j)!
        if (dik + dkj < dist.get(i)!.get(j)!) {
          dist.get(i)!.set(j, dik + dkj)
          next.get(i)!.set(j, next.get(i)!.get(k)!)
        }
      }
    }
  }
  return { dist, next }
}

function pathLegs(from: string, to: string, next: Map<string, Map<string, string>>): Leg[] {
  if (from === to) return []
  const legs: Leg[] = []
  let current = from
  let guard = 0
  while (current !== to && guard++ < REGIONS.length) {
    const nxt = next.get(current)?.get(to)
    if (!nxt) break
    const e = edge(current, nxt)
    if (e) legs.push(e)
    current = nxt
  }
  return legs
}

function scoreRegion(region: Region, interests: Interest[]): number {
  const base = 0.15
  if (interests.length === 0) {
    return base + Object.values(region.tags).reduce((a, b) => a + (b ?? 0), 0) * 0.1
  }
  return base + interests.reduce((sum, i) => sum + (region.tags[i] ?? 0), 0)
}

// Nobody takes a 4-hour train for a 3-day trip. Cap how far the route can
// reach based on how much time there is to spend at the far end.
function maxTravelHoursFor(totalDays: number): number {
  if (totalDays <= 4) return 2
  if (totalDays <= 8) return 4.5
  return Infinity
}

export function planTrip(input: PlannerInput): Itinerary {
  const { days, interests, pace, budget, arrival } = input
  const { dist, next } = buildAllPairs()
  const scores = new Map(REGIONS.map((r) => [r.id, scoreRegion(r, interests)]))
  const maxHours = maxTravelHoursFor(days)

  const arrivalRegion = REGION_BY_ID.get(arrival)!
  const selected: RouteStop[] = [{ region: arrivalRegion, days: arrivalRegion.minDays }]
  const selectedIds = new Set<string>([arrival])
  let runningMinDays = arrivalRegion.minDays
  let current: string = arrival

  // Greedily extend the route: at each step, add whichever unvisited region
  // gives the best score-per-day-of-travel-and-stay, as long as it still
  // fits the remaining day budget.
  while (true) {
    let best: { region: Region; efficiency: number } | null = null
    for (const region of REGIONS) {
      if (selectedIds.has(region.id)) continue
      if (runningMinDays + region.minDays > days) continue
      const hours = dist.get(current)!.get(region.id) ?? Infinity
      if (hours > maxHours) continue
      const efficiency = scores.get(region.id)! / (region.minDays + hours * 0.3)
      if (!best || efficiency > best.efficiency) best = { region, efficiency }
    }
    if (!best) break
    selected.push({ region: best.region, days: best.region.minDays })
    selectedIds.add(best.region.id)
    runningMinDays += best.region.minDays
    current = best.region.id
  }

  // Water-fill remaining days across selected stops, weighted by score, but
  // stop feeding a region once it's run out of distinct activities to fill
  // those days with — otherwise one popular stop hoards days as filler while
  // others go under-visited. (A little slack — content isn't 1:1 with days.)
  const slotsPerDay = PACE_SLOTS[pace]
  const contentCapDays = (regionId: string) => {
    const count = ACTIVITIES_BY_REGION[regionId]?.length ?? 0
    return Math.max(1, Math.ceil(count / slotsPerDay) + 1)
  }
  let leftover = days - runningMinDays
  while (leftover > 0) {
    let target: RouteStop | null = null
    for (const stop of selected) {
      const cap = Math.min(stop.region.maxDays, contentCapDays(stop.region.id))
      if (stop.days >= cap) continue
      if (!target || scores.get(stop.region.id)! > scores.get(target.region.id)!) target = stop
    }
    if (!target) break
    target.days += 1
    leftover -= 1
  }
  if (leftover > 0) selected[0].days += leftover // everyone's content-capped; park the rest at the first stop

  const legs: Leg[] = []
  for (let i = 0; i < selected.length - 1; i++) {
    legs.push(...pathLegs(selected[i].region.id, selected[i + 1].region.id, next))
  }
  if (selected.length > 1) {
    legs.push(...pathLegs(selected[selected.length - 1].region.id, arrival, next))
  }
  const totalTravelHours = legs.reduce((sum, l) => sum + l.hours, 0)

  const usedActivities = new Set<string>()
  const dayPlans: DayPlan[] = []
  let dayCounter = 1
  for (const stop of selected) {
    const pool = (ACTIVITIES_BY_REGION[stop.region.id] ?? [])
      .filter((a) => !usedActivities.has(a.id))
      .sort((a, b) => {
        const am = interests.length ? a.tags.filter((t) => interests.includes(t)).length : 0
        const bm = interests.length ? b.tags.filter((t) => interests.includes(t)).length : 0
        return bm - am
      })
    for (let d = 0; d < stop.days; d++) {
      const picks = pool.splice(0, slotsPerDay)
      picks.forEach((p) => usedActivities.add(p.id))
      dayPlans.push({ day: dayCounter, regionId: stop.region.id, activities: picks })
      dayCounter++
    }
  }

  const transportCost = legs.reduce((sum, l) => sum + l.yen, 0)
  const lodging = selected.reduce((sum, s) => sum + s.region.lodgingPerNight[budget] * s.days, 0)
  const food = selected.reduce((sum, s) => sum + s.region.foodPerDay[budget] * s.days, 0)
  const activitiesCost = dayPlans.reduce((sum, d) => sum + d.activities.reduce((s, a) => s + a.yen, 0), 0)
  const cost: CostBreakdown = {
    transport: transportCost,
    lodging,
    food,
    activities: activitiesCost,
    total: transportCost + lodging + food + activitiesCost,
  }

  const jrSpend = legs.filter((l) => l.jrPassCovered).reduce((sum, l) => sum + l.yen, 0)
  const passDays: 7 | 14 | 21 = days <= 7 ? 7 : days <= 14 ? 14 : 21
  const passPrice = JR_PASS_PRICE[passDays]
  const jrPass: JrPassVerdict = {
    recommended: jrSpend > passPrice,
    jrSpend,
    passPrice,
    passDays,
    savings: jrSpend - passPrice,
  }

  return { stops: selected, legs, days: dayPlans, cost, jrPass, totalTravelHours }
}
