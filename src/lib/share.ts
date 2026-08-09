import type { PlannerInput } from './itinerary'

// Bumped whenever PlannerInput's shape changes in a way older links can't
// satisfy. Old links fail to decode cleanly instead of silently producing a
// wrong or half-populated trip.
const SCHEMA_VERSION = 2

export function encodeInput(input: PlannerInput): string {
  return btoa(encodeURIComponent(JSON.stringify({ v: SCHEMA_VERSION, ...input })))
}

export function decodeInput(hash: string): PlannerInput | null {
  if (!hash) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(atob(hash)))
    if (parsed.v !== SCHEMA_VERSION) return null
    const { v: _v, ...input } = parsed
    return input as PlannerInput
  } catch {
    return null
  }
}
