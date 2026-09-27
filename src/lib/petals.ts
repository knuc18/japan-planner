// A tiny bus so anything on the page (a shaken branch, a punched ticket) can
// throw petals into the shared sakura field without owning a canvas itself.

export interface PetalBurst {
  /** Viewport coordinates, as from a pointer event. */
  x: number
  y: number
  count: number
  /** How hard the petals are thrown outward, in px/s. */
  force?: number
}

type Listener = (burst: PetalBurst) => void

const listeners = new Set<Listener>()

export function releasePetals(burst: PetalBurst) {
  listeners.forEach((l) => l(burst))
}

export function onPetalBurst(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
