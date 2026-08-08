import { describe, it, expect } from 'vitest'
import { planTrip } from './itinerary'

import type { Interest } from '../data/regions'

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

  it('flips the JR Pass recommendation across the break-even threshold', () => {
    const shortTrip = planTrip({ ...base, days: 3, budget: 'mid' })
    const midTrip = planTrip({ ...base, days: 6, budget: 'mid' })
    expect(shortTrip.jrPass.recommended).toBe(false)
    expect(midTrip.jrPass.recommended).toBe(true)
  })

  it('never repeats an activity across the itinerary', () => {
    const trip = planTrip({ ...base, days: 30, budget: 'mid' })
    const ids = trip.days.flatMap((d) => d.activities.map((a) => a.id))
    expect(new Set(ids).size).toBe(ids.length)
  })
})
