import type { Itinerary, PlannerInput } from './itinerary'
import { REGION_BY_ID } from '../data/regions'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
}

// Commas, semicolons, and backslashes are structural in ICS text values.
function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n')
}

/** One all-day event per day of the trip. If no travel month was given,
 * anchors the calendar to today rather than leaving dates blank — dates are
 * already an estimate everywhere else in this app (fares, weather), so a
 * placeholder start is consistent, not a special case. */
export function buildIcs(trip: Itinerary, input: PlannerInput): string {
  const start = input.travelMonth
    ? new Date(input.travelYear ?? new Date().getFullYear(), input.travelMonth - 1, 1)
    : new Date()

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Japan Trip Planner//EN',
    'CALSCALE:GREGORIAN',
  ]

  trip.days.forEach((day, i) => {
    const date = new Date(start)
    date.setDate(date.getDate() + i)
    const next = new Date(date)
    next.setDate(next.getDate() + 1)
    const region = REGION_BY_ID.get(day.regionId)
    const summary = `Day ${day.day}: ${region?.name ?? day.regionId}`
    const description = day.activities.length
      ? day.activities.map((a) => `${a.name} (${a.hours}h, ¥${a.yen})`).join('\\n')
      : 'Open day — wander, rest, or day-trip on your own.'

    lines.push(
      'BEGIN:VEVENT',
      `UID:day-${day.day}-${date.getTime()}@japan-trip-planner`,
      `DTSTAMP:${formatDate(new Date())}T000000Z`,
      `DTSTART;VALUE=DATE:${formatDate(date)}`,
      `DTEND;VALUE=DATE:${formatDate(next)}`,
      `SUMMARY:${escapeText(summary)}`,
      `DESCRIPTION:${escapeText(description)}`,
      'END:VEVENT',
    )
  })

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadIcs(trip: Itinerary, input: PlannerInput): void {
  const blob = new Blob([buildIcs(trip, input)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'japan-trip.ics'
  a.click()
  URL.revokeObjectURL(url)
}
