import { describe, expect, it } from 'vitest'
import { flowerCount, planBranch, type BranchOptions } from './branch'

const LEFT: BranchOptions = {
  seed: 606,
  width: 560,
  height: 230,
  start: [-24, 20],
  angle: 0.2,
  length: 470,
  thickness: 17,
  density: 1.05,
  avoid: { x0: 150, y0: 150, x1: 560, y1: 230 },
}

describe('planBranch', () => {
  it('grows the same branch from the same seed', () => {
    expect(planBranch(LEFT)).toEqual(planBranch(LEFT))
    expect(planBranch({ ...LEFT, seed: 607 })).not.toEqual(planBranch(LEFT))
  })

  it('lists every parent before its children, as the renderer needs', () => {
    const plan = planBranch(LEFT)
    expect(plan.limbs[0].parent).toBe(-1)
    for (const l of plan.limbs.slice(1)) expect(l.parent).toBeGreaterThanOrEqual(0)
    for (const l of plan.limbs) expect(l.parent).toBeLessThan(l.id)
  })

  it('keeps wood and blossom off the open edges and out of the headline box', () => {
    for (const seed of [1, 14, 606, 2024, 31337]) {
      const plan = planBranch({ ...LEFT, seed })
      for (const l of plan.limbs) {
        for (const [x, y] of l.pts.slice(1)) {
          expect(x).toBeLessThanOrEqual(LEFT.width - 30)
          expect(y).toBeLessThanOrEqual(LEFT.height - 26)
        }
        for (const f of l.flowers) {
          expect(f.x).toBeLessThanOrEqual(LEFT.width - 16)
          expect(f.y).toBeLessThanOrEqual(LEFT.height - 16)
          const inHeadline = f.x > 136 && f.y > 136
          expect(inHeadline).toBe(false)
        }
      }
    }
  })

  it('carries a sensible amount of blossom', () => {
    const n = flowerCount(planBranch(LEFT))
    expect(n).toBeGreaterThan(40)
    expect(n).toBeLessThan(260)
  })

  it('mirrors a branch grown the other way', () => {
    const plain = planBranch({ ...LEFT, avoid: undefined })
    const mirrored = planBranch({ ...LEFT, avoid: undefined, mirror: true })
    const a = plain.limbs[0].flowers[0] ?? plain.limbs.find((l) => l.flowers.length)!.flowers[0]
    const b = mirrored.limbs[0].flowers[0] ?? mirrored.limbs.find((l) => l.flowers.length)!.flowers[0]
    expect(b.x).toBeCloseTo(LEFT.width - a.x)
    expect(b.y).toBeCloseTo(a.y)
    expect(mirrored.limbs[0].outline.length).toBeGreaterThan(0)
  })
})
