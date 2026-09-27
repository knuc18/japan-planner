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

// The petal field owns the weather. It publishes the current breeze here each
// frame so the branches can bend in the same gusts that carry the petals.

const wind = { speed: 18, gust: 0 }

export function setWind(speed: number, gust: number) {
  wind.speed = speed
  wind.gust = gust
}

/** Breeze speed in px/s (positive blows right) and gust strength, 0..1. */
export function getWind(): Readonly<typeof wind> {
  return wind
}
