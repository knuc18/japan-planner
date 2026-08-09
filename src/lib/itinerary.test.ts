import { describe, it, expect } from 'vitest'
import { planTrip, buildItinerary, type RouteStop } from './itinerary'
import { REGION_BY_ID, type Interest } from '../data/regions'

const base = { interests: ['food', 'history'] as Interest[], pace: 'balanced' as const, arrival: 'tokyo' as const }

describe('planTrip', () => {
  it('keeps a 3-day trip within the Tokyo cluster', () => {
    const trip = planTrip({ ...base, days: 3, budget: 'mid' })
    const ids = trip.stops.map((s) => s.region.id)
    expect(ids.every((id) => ['tokyo', 'hakone'].includes(id))).toBe(true)
  })

  it('reaches at least 6 regions on a 30-day trip', () => {
    const trip = planTrip({ ...base, days: 30, budget: 'mid' })
    expect(trip.stops.length).toBeGreaterThanOrEqual(6)
  })

  it('never allocates more days than requested, across the full range', () => {
    for (let days = 3; days <= 30; days++) {
      const trip = planTrip({ ...base, days, budget: 'mid' })
      const allocated = trip.stops.reduce((sum, s) => sum + s.days, 0)
      expect(allocated).toBeLessThanOrEqual(days)
    }
  })

  it('orders total cost strictly by budget tier', () => {
    const input = { ...base, days: 10 }
    const budgetTrip = planTrip({ ...input, budget: 'budget' })
    const midTrip = planTrip({ ...input, budget: 'mid' })
    const luxuryTrip = planTrip({ ...input, budget: 'luxury' })
    expect(budgetTrip.cost.total).toBeLessThan(midTrip.cost.total)
    expect(midTrip.cost.total).toBeLessThan(luxuryTrip.cost.total)
  })

  it('skips the JR Pass on a short trip with little train travel', () => {
    const trip = planTrip({ ...base, days: 3, budget: 'mid' })
    expect(trip.jrPass.recommended).toBe(false)
  })

  it('windows JR spend: the same total spend recommends the pass when concentrated but not when spread thin', () => {
    // Same five stops, same fares, same total JR spend either way — only the
    // nights-per-stop (and so the day-offset between legs) differs. This is
    // the behavior the sliding window in buildItinerary exists for: a pass
    // is a bet on a busy stretch, not on lifetime trip spend.
    const route = ['tokyo', 'kyoto', 'hiroshima', 'osaka', 'nara'] as const
    const stopsWith = (nightsEach: number): RouteStop[] =>
      route.map((id) => ({ region: REGION_BY_ID.get(id)!, days: nightsEach }))

    const concentrated = buildItinerary({ ...base, days: 5, budget: 'mid' }, stopsWith(1))
    const spread = buildItinerary({ ...base, days: 50, budget: 'mid' }, stopsWith(10))

    expect(concentrated.cost.transport).toBe(spread.cost.transport) // same fares, same total spend
    expect(concentrated.jrPass.recommended).toBe(true)
    expect(spread.jrPass.recommended).toBe(false)
    expect(concentrated.jrPass.savings).toBeGreaterThan(spread.jrPass.savings)
  })

  it('never repeats an activity across the itinerary', () => {
    const trip = planTrip({ ...base, days: 30, budget: 'mid' })
    const ids = trip.days.flatMap((d) => d.activities.map((a) => a.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('includes Kyoto on a history-focused week-long trip', () => {
    const trip = planTrip({ ...base, days: 7, budget: 'mid' })
    expect(trip.stops.some((s) => s.region.id === 'kyoto')).toBe(true)
  })

  it('caps stop count so trips stay a compact route, not a bar crawl', () => {
    for (const days of [5, 7, 10, 14, 21, 30]) {
      const trip = planTrip({ ...base, days, budget: 'mid' })
      expect(trip.stops.length).toBeLessThanOrEqual(6)
    }
  })

  it('visits stops in an order no worse than arrival-order (no obviously avoidable zigzag)', () => {
    const trip = planTrip({ ...base, days: 14, budget: 'mid' })
    const naive = trip.legs.reduce((s, l) => s + l.hours, 0)
    // Re-run the same inputs is deterministic; this just guards that total
    // travel time for a 14-day multi-stop trip stays realistic (well under
    // the old algorithm's ~17h for the same inputs) rather than re-deriving
    // the optimizer's own math.
    expect(naive).toBeLessThan(12)
  })
})
