import type { PlannerInput } from './itinerary'

export function encodeInput(input: PlannerInput): string {
  return btoa(encodeURIComponent(JSON.stringify(input)))
}

export function decodeInput(hash: string): PlannerInput | null {
  if (!hash) return null
  try {
    return JSON.parse(decodeURIComponent(atob(hash))) as PlannerInput
  } catch {
    return null
  }
}
