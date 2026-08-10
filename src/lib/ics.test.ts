import { describe, it, expect } from 'vitest'
import { buildIcs } from './ics'
import { planTrip, type PlannerInput } from './itinerary'

describe('buildIcs', () => {
  const input: PlannerInput = {
    days: 5,
    interests: ['food', 'history'],
    pace: 'balanced',
    budget: 'mid',
    arrival: 'tokyo',
    travelMonth: 4,
    travelYear: 2026,
  }
  const trip = planTrip(input)

  it('produces a well-formed VCALENDAR with one VEVENT per day', () => {
    const ics = buildIcs(trip, input)
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true)
    expect(ics.trim().endsWith('END:VCALENDAR')).toBe(true)
    expect(ics.match(/BEGIN:VEVENT/g)?.length).toBe(trip.days.length)
    expect(ics.match(/END:VEVENT/g)?.length).toBe(trip.days.length)
  })

  it('anchors the first day to the 1st of the given travel month', () => {
    const ics = buildIcs(trip, input)
    expect(ics).toContain('DTSTART;VALUE=DATE:20260401')
  })

  it('escapes commas in activity names so the file stays parseable', () => {
    const ics = buildIcs(trip, input)
    // Every DESCRIPTION line's raw commas must be escaped, not literal.
    for (const line of ics.split('\r\n')) {
      if (!line.startsWith('DESCRIPTION:')) continue
      expect(line).not.toMatch(/[^\\],/) // a comma not preceded by a backslash
    }
  })
})
