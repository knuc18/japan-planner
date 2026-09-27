// Procedural cherry branches.
//
// A branch is grown once from a seed into plain geometry: a tree of limbs
// (each with a centreline, a taper, and outline paths for bark, light and
// shade) carrying clusters of flowers on stalks. Nothing here draws or moves;
// the component paints this plan and swings each limb about its pivot.
//
// Cherry wood has a few tells worth copying: limbs taper hard, zig-zag
// slightly at every node, droop toward their tips, and carry horizontal
// lenticels across the bark. Flowers come in umbels of two to five on long
// stalks, so they hang in bunches and face every which way.

export type Vec = [number, number]

export type FlowerKind = 'open' | 'half' | 'side' | 'back' | 'bud'

export interface Flower {
  /** Centre (open, back) or base (side, half, bud), in plan units. */
  x: number
  y: number
  /** Where its stalk leaves the twig. */
  ax: number
  ay: number
  /** Sprite rotation in radians. For side/half/bud, sprite "up" points along the stalk. */
  rot: number
  /** Scale relative to the unit flower (petal length 10). */
  size: number
  /** Foreshortening: 1 = seen face-on. */
  squash: number
  kind: FlowerKind
  variant: number
  /** Seconds after mount before it opens. */
  delay: number
  /** Drawn in front of its limb rather than behind. */
  front: boolean
  phase: number
}

export interface Leaf {
  x: number
  y: number
  rot: number
  size: number
  delay: number
}

export interface Limb {
  id: number
  parent: number
  depth: number
  pivot: Vec
  tip: Vec
  length: number
  pts: Vec[]
  widths: number[]
  /** SVG path data, in plan units. */
  outline: string
  light: string
  shade: string
  lenticels: string
  flowers: Flower[]
  leaves: Leaf[]
  /** Seconds after mount before it starts growing. */
  delay: number
}

export interface BranchPlan {
  width: number
  height: number
  limbs: Limb[]
}

export interface BranchOptions {
  seed: number
  width: number
  height: number
  /** Where the limb enters, and the direction it heads (radians, 0 = right, +y down). */
  start: Vec
  angle: number
  length: number
  thickness: number
  /** Grow toward the left instead: everything is mirrored after growing. */
  mirror?: boolean
  /** Flower abundance, around 1. */
  density?: number
  /** Stay out of this box (plan units, before mirroring), e.g. where the headline sits. */
  avoid?: { x0: number; y0: number; x1: number; y1: number }
  /** Stop branching once there are this many limbs. */
  maxLimbs?: number
}

/** Seconds a limb takes to grow out. */
export const GROW_SECONDS = 0.9

// Light comes from the upper left, as it does on the hero sun and moon.
const LIGHT: Vec = normalize([-0.45, -1])

const OPEN_VARIANTS = 4

function seeded(seed: number) {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function normalize([x, y]: Vec): Vec {
  const l = Math.hypot(x, y) || 1
  return [x / l, y / l]
}

const f1 = (n: number) => (Math.round(n * 10) / 10).toString()

/** Smooth closed-ish curve through points (Catmull-Rom as cubic Béziers), continuing an open path. */
function curveThrough(points: Vec[]): string {
  let d = ''
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1: Vec = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Vec = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`
  }
  return d
}

function tangents(pts: Vec[]): Vec[] {
  return pts.map((_, i) => {
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(pts.length - 1, i + 1)]
    return normalize([b[0] - a[0], b[1] - a[1]])
  })
}

/**
 * A tapered body along the centreline. `offset` shifts it toward the lit side
 * (as a fraction of the local width) and `scale` narrows it, which is how the
 * light and shade strips are cut from the same spine.
 */
function taperedOutline(pts: Vec[], widths: number[], offset = 0, scale = 1): string {
  const tans = tangents(pts)
  // One consistent "lit" side per limb, so the highlight never flips mid-limb.
  const avg = tans.reduce((s, t) => s + (-t[1] * LIGHT[0] + t[0] * LIGHT[1]), 0)
  const sign = avg >= 0 ? 1 : -1
  const left: Vec[] = []
  const right: Vec[] = []
  pts.forEach((p, i) => {
    const n: Vec = [-tans[i][1] * sign, tans[i][0] * sign]
    const half = (widths[i] * scale) / 2
    const c: Vec = [p[0] + n[0] * offset * widths[i], p[1] + n[1] * offset * widths[i]]
    left.push([c[0] + n[0] * half, c[1] + n[1] * half])
    right.push([c[0] - n[0] * half, c[1] - n[1] * half])
  })
  const last = pts.length - 1
  const t = tans[last]
  const capHalf = (widths[last] * scale) / 2
  const cap: Vec = [pts[last][0] + t[0] * capHalf * 1.4, pts[last][1] + t[1] * capHalf * 1.4]
  const back = [...right].reverse()
  return (
    `M${f1(left[0][0])} ${f1(left[0][1])}` +
    curveThrough(left) +
    `Q${f1(cap[0])} ${f1(cap[1])} ${f1(back[0][0])} ${f1(back[0][1])}` +
    curveThrough(back) +
    'Z'
  )
}

/** Short marks across the bark, the horizontal lenticels cherry is known for. */
function lenticelMarks(pts: Vec[], widths: number[], rnd: () => number): string {
  const tans = tangents(pts)
  let d = ''
  for (let i = 0; i < pts.length - 1; i++) {
    const w = widths[i]
    if (w < 4.5) continue
    const seg = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1])
    for (let s = rnd() * 4; s < seg; s += 4 + rnd() * 5) {
      const u = s / seg
      const p: Vec = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u]
      const n: Vec = [-tans[i][1], tans[i][0]]
      const a = w * (0.08 + rnd() * 0.3)
      const b = w * (0.08 + rnd() * 0.3)
      d += `M${f1(p[0] - n[0] * a)} ${f1(p[1] - n[1] * a)}L${f1(p[0] + n[0] * b)} ${f1(p[1] + n[1] * b)}`
    }
  }
  return d
}

// Tuning per depth: 0 = the limb entering the frame, 3 = the smallest spurs.
const SEG = [16, 12, 9]
const CHILD_CHANCE = [0.32, 0.22, 0]
const CLUSTER_CHANCE = [0.3, 0.24, 0.3]
const MAX_DEPTH = 2

export function planBranch(opts: BranchOptions): BranchPlan {
  const rnd = seeded(opts.seed)
  const rand = (a: number, b: number) => a + rnd() * (b - a)
  const { width: W, height: H } = opts
  const density = opts.density ?? 1
  const maxLimbs = opts.maxLimbs ?? 22
  const limbs: Limb[] = []
  // Blossom stays inside the frame on the open sides; the entry edges (left
  // and top, before mirroring) are the viewport's, where cropping is natural.
  const EDGE = 16
  const inFrame = (x: number, y: number) => {
    if (x > W - EDGE || y > H - EDGE) return false
    const av = opts.avoid
    return !(av && x > av.x0 - 14 && x < av.x1 && y > av.y0 - 14)
  }

  // Keep the growth hanging: from a little above level to straight down.
  const bend = (a: number, depth: number) => Math.max(depth === 0 ? -0.35 : -0.25, Math.min(depth === 0 ? 0.8 : 1.7, a))

  /** Wood may not grow past the open edges or into the headline's box. */
  function roomFor(p: Vec): boolean {
    if (p[0] > W - 30 || p[1] > H - 26 || p[1] < 4) return false
    const av = opts.avoid
    return !(av && p[0] > av.x0 - 26 && p[0] < av.x1 && p[1] > av.y0 - 36)
  }

  function grow(parent: number, depth: number, start: Vec, angle: number, length: number, w0: number, w1: number, delay: number) {
    const id = limbs.length
    const segLen = SEG[depth]
    const n = Math.max(2, Math.round(length / segLen))
    const pts: Vec[] = [start]
    const widths: number[] = [w0]
    let a = angle
    let zig = rnd() < 0.5 ? 1 : -1
    const droop = depth === 0 ? 0.012 : 0.028 + depth * 0.012
    for (let i = 1; i <= n; i++) {
      a += (rnd() - 0.5) * (depth === 0 ? 0.2 : 0.14) + (depth > 0 ? zig * 0.07 : 0)
      zig = -zig
      a = bend(a + droop * (i / n), depth)
      const prev = pts[i - 1]
      const step = segLen * rand(0.85, 1.15)
      const next: Vec = [prev[0] + Math.cos(a) * step, prev[1] + Math.sin(a) * step]
      // A limb that runs out of room simply ends there, as pruned wood does.
      if (i > 1 && !roomFor(next)) break
      pts.push(next)
    }
    // Taper over the length it actually reached.
    const reached = pts.length - 1
    for (let i = 1; i <= reached; i++) widths.push(w0 + (w1 - w0) * Math.pow(i / reached, 0.85))
    const limb: Limb = {
      id,
      parent,
      depth,
      pivot: start,
      tip: pts[pts.length - 1],
      length,
      pts,
      widths,
      outline: '',
      light: '',
      shade: '',
      lenticels: '',
      flowers: [],
      leaves: [],
      delay,
    }
    limbs.push(limb)

    const tans = tangents(pts)
    let side = rnd() < 0.5 ? 1 : -1
    let children = 0
    for (let i = 2; i < pts.length - 1; i++) {
      const u = i / (pts.length - 1)
      const at = pts[i]
      const ta = Math.atan2(tans[i][1], tans[i][0])
      const reach = delay + u * GROW_SECONDS * 0.75

      const forceChild = depth === 0 && children < 3 && i === Math.round((pts.length - 1) * (0.25 + children * 0.22))
      if (depth < MAX_DEPTH && limbs.length < maxLimbs && (forceChild || rnd() < CHILD_CHANCE[depth])) {
        // Shoots on the upper side stay shallow; the lower ones hang.
        const ca = ta + (side > 0 ? rand(0.55, 1.1) : -rand(0.3, 0.7))
        const remaining = length * (1 - u)
        const cl = depth === 0 ? rand(0.3, 0.55) * length : Math.max(18, remaining * rand(0.45, 0.85))
        const cw0 = widths[i] * rand(0.52, 0.66)
        const inset: Vec = [at[0] - tans[i][0] * widths[i] * 0.15, at[1] - tans[i][1] * widths[i] * 0.15]
        grow(id, depth + 1, inset, ca, cl, cw0, Math.max(0.7, cw0 * 0.22), reach)
        side = -side
        children++
        continue
      }

      const thin = depth > 0 || widths[i] < opts.thickness * 0.6
      if (thin && rnd() < CLUSTER_CHANCE[depth] * density) {
        cluster(limb, at, ta + side * Math.PI / 2, reach, depth)
        side = -side
      }
    }

    // Every twig ends in blossom (or, now and then, a young leaf).
    {
      const t = tans[tans.length - 1]
      const ta = Math.atan2(t[1], t[0])
      if (rnd() < 0.75 * Math.min(1, density)) cluster(limb, limb.tip, ta + rand(-0.4, 0.4), delay + GROW_SECONDS * 0.8, depth)
      if (depth >= 2 && rnd() < 0.3) {
        limb.leaves.push({ x: limb.tip[0], y: limb.tip[1], rot: ta + Math.PI / 2 + rand(-0.7, 0.7), size: rand(0.6, 0.9), delay: delay + GROW_SECONDS })
      }
    }
    return limb
  }

  function cluster(limb: Limb, at: Vec, dir: number, delay: number, depth: number) {
    // Stalks leave the twig to one side and sag toward the ground.
    const down = Math.PI / 2
    const diff = Math.atan2(Math.sin(down - dir), Math.cos(down - dir))
    const base = dir + diff * 0.45
    const count = 2 + Math.floor(rnd() * (depth >= 2 ? 3.2 : 2.6))
    for (let k = 0; k < count; k++) {
      const d = base + rand(-0.95, 0.95)
      const r = rnd()
      const kind: FlowerKind = r < 0.13 ? 'bud' : r < 0.23 ? 'half' : r < 0.36 ? 'side' : r < 0.41 ? 'back' : 'open'
      const size = kind === 'bud' ? rand(0.7, 0.9) : rand(0.85, 1.18)
      const stalk = rand(9, 19) * (kind === 'bud' ? 0.75 : 1)
      const x = at[0] + Math.cos(d) * stalk
      const y = at[1] + Math.sin(d) * stalk
      if (!inFrame(x, y)) continue
      const pointed = kind === 'side' || kind === 'half' || kind === 'bud'
      limb.flowers.push({
        x,
        y,
        ax: at[0],
        ay: at[1],
        rot: pointed ? d + Math.PI / 2 : rand(0, Math.PI * 2),
        size,
        squash: kind === 'open' ? rand(0.55, 1) : kind === 'back' ? rand(0.7, 1) : 1,
        kind,
        variant: kind === 'open' ? Math.floor(rnd() * OPEN_VARIANTS) : 0,
        delay: delay + GROW_SECONDS * 0.35 + rand(0, 0.45),
        front: rnd() < 0.74,
        phase: rand(0, Math.PI * 2),
      })
    }
  }

  grow(-1, 0, opts.start, opts.angle, opts.length, opts.thickness, Math.max(1.4, opts.thickness * 0.16), 0)

  if (opts.mirror) {
    const mx = (v: Vec): Vec => [W - v[0], v[1]]
    for (const l of limbs) {
      l.pts = l.pts.map(mx)
      l.pivot = mx(l.pivot)
      l.tip = mx(l.tip)
      for (const f of l.flowers) {
        f.x = W - f.x
        f.ax = W - f.ax
        f.rot = -f.rot
      }
      for (const lf of l.leaves) {
        lf.x = W - lf.x
        lf.rot = -lf.rot
      }
    }
  }

  // Paths are cut after mirroring so the light still falls from the upper left.
  const marks = seeded(opts.seed ^ 0x5eed)
  for (const l of limbs) {
    l.outline = taperedOutline(l.pts, l.widths)
    l.shade = taperedOutline(l.pts, l.widths, -0.24, 0.5)
    l.light = taperedOutline(l.pts, l.widths, 0.26, 0.3)
    l.lenticels = lenticelMarks(l.pts, l.widths, marks)
  }

  return { width: W, height: H, limbs }
}

export function flowerCount(plan: BranchPlan) {
  return plan.limbs.reduce((s, l) => s + l.flowers.length, 0)
}
