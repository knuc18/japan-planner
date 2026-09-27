import type { BranchPlan, Flower, FlowerKind, Leaf, Limb } from './branch'

// Painting for procedural branches. Flowers are drawn once per theme into
// small sprites (one per kind and variant) and stamped with transforms each
// frame; limbs are filled from cached Path2D outlines. The whole frame is a
// few dozen fills and a hundred-odd drawImage calls.

export interface Palette {
  barkBase: string
  barkLight: string
  barkDark: string
  lenticel: string
  pedicel: string
  petalCore: string
  petalMid: string
  petalEdge: string
  rim: string
  eye: string
  filament: string
  anther: string
  calyx: string
  leafA: string
  leafB: string
  night: boolean
}

export function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement)
  const v = (name: string) => cs.getPropertyValue(name).trim()
  return {
    barkBase: v('--bark-base'),
    barkLight: v('--bark-light'),
    barkDark: v('--bark-dark'),
    lenticel: v('--bark-lenticel'),
    pedicel: v('--sakura-stalk'),
    petalCore: v('--sakura-core'),
    petalMid: v('--sakura-mid'),
    petalEdge: v('--sakura-edge'),
    rim: v('--sakura-rim'),
    eye: v('--sakura-eye'),
    filament: v('--sakura-filament'),
    anther: v('--sakura-anther'),
    calyx: v('--sakura-calyx'),
    leafA: v('--leaf-a'),
    leafB: v('--leaf-b'),
    night: document.documentElement.dataset.theme === 'dark',
  }
}

// --- Flower geometry (unit flower: petals 10 long, origin at the centre) ---

type Mat = [number, number, number, number, number, number]

function rotScale(angle: number, sx: number, sy: number, tx = 0, ty = 0): Mat {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return [c * sx, s * sx, -s * sy, c * sy, tx, ty]
}

function apply(m: Mat, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]
}

// One petal pointing up (−y): an obovate blade with the notch sakura have at the tip.
const PETAL: number[][] = [
  [0, 0],
  [-3.9, -1.7, -5.8, -5.6, -3.8, -8.7],
  [-2.9, -10.0, -1.3, -10.3, -0.55, -9.45],
  [0, -8.55],
  [0.55, -9.45],
  [1.3, -10.3, 2.9, -10.0, 3.8, -8.7],
  [5.8, -5.6, 3.9, -1.7, 0, 0],
]

function petalPath(m: Mat): Path2D {
  const p = new Path2D()
  const [x0, y0] = apply(m, PETAL[0][0], PETAL[0][1])
  p.moveTo(x0, y0)
  for (const seg of PETAL.slice(1)) {
    if (seg.length === 2) {
      const [x, y] = apply(m, seg[0], seg[1])
      p.lineTo(x, y)
    } else {
      const a = apply(m, seg[0], seg[1])
      const b = apply(m, seg[2], seg[3])
      const c = apply(m, seg[4], seg[5])
      p.bezierCurveTo(a[0], a[1], b[0], b[1], c[0], c[1])
    }
  }
  p.closePath()
  return p
}

function seeded(seed: number) {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Half-extent of every sprite, in unit-flower coordinates. */
export const SPRITE_EXTENT = 13

function petalFill(ctx: CanvasRenderingContext2D, pal: Palette, cx: number, cy: number, reach: number, pinker = 0) {
  const g = ctx.createRadialGradient(cx, cy, 0.3, cx, cy, reach)
  g.addColorStop(0, pal.petalCore)
  g.addColorStop(0.3 - pinker * 0.1, pal.petalMid)
  g.addColorStop(0.78, pal.petalEdge)
  g.addColorStop(1, pal.petalEdge)
  return g
}

function drawPetals(ctx: CanvasRenderingContext2D, pal: Palette, mats: Mat[], cx: number, cy: number, reach: number, pinker = 0) {
  const fill = petalFill(ctx, pal, cx, cy, reach, pinker)
  for (const m of mats) {
    const p = petalPath(m)
    ctx.fillStyle = fill
    ctx.fill(p)
    ctx.strokeStyle = pal.rim
    ctx.lineWidth = 0.28
    ctx.stroke(p)
    // Three faint veins fanning to the tip.
    ctx.beginPath()
    for (const vx of [-1.6, 0, 1.6]) {
      const a = apply(m, 0, -0.8)
      const b = apply(m, vx * 0.6, -4.5)
      const c = apply(m, vx, -7.4)
      ctx.moveTo(a[0], a[1])
      ctx.quadraticCurveTo(b[0], b[1], c[0], c[1])
    }
    ctx.strokeStyle = pal.rim
    ctx.globalAlpha *= 0.55
    ctx.lineWidth = 0.16
    ctx.stroke()
    ctx.globalAlpha /= 0.55
  }
}

function drawStamens(ctx: CanvasRenderingContext2D, pal: Palette, rnd: () => number, count: number, from: number, to: [number, number], spread = Math.PI * 2, base = 0, cx = 0, cy = 0, squash = 1) {
  // A blush at the heart; Somei Yoshino centres redden as the flower ages.
  const eye = ctx.createRadialGradient(cx, cy, 0, cx, cy, 2.8)
  eye.addColorStop(0, pal.eye)
  eye.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = eye
  ctx.globalAlpha *= 0.55
  ctx.beginPath()
  ctx.ellipse(cx, cy, 2.8, 2.8 * squash, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha /= 0.55

  const tips: [number, number][] = []
  ctx.beginPath()
  for (let i = 0; i < count; i++) {
    const a = base - spread / 2 + (spread * (i + rnd() * 0.8)) / count
    const r = to[0] + rnd() * (to[1] - to[0])
    const bend = (rnd() - 0.5) * 0.5
    const x0 = cx + Math.sin(a) * from
    const y0 = cy - Math.cos(a) * from * squash
    const x1 = cx + Math.sin(a + bend) * r
    const y1 = cy - Math.cos(a + bend) * r * squash
    ctx.moveTo(x0, y0)
    ctx.quadraticCurveTo(cx + Math.sin(a) * r * 0.6, cy - Math.cos(a) * r * 0.6 * squash, x1, y1)
    tips.push([x1, y1])
  }
  ctx.strokeStyle = pal.filament
  ctx.lineWidth = 0.24
  ctx.stroke()
  ctx.fillStyle = pal.anther
  for (const [x, y] of tips) {
    ctx.beginPath()
    ctx.arc(x, y, 0.5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = '#d3dd8a'
  ctx.beginPath()
  ctx.arc(cx, cy, 0.55, 0, Math.PI * 2)
  ctx.fill()
}

function calyxCup(ctx: CanvasRenderingContext2D, pal: Palette, y: number) {
  ctx.fillStyle = pal.calyx
  ctx.beginPath()
  ctx.moveTo(-2.5, y - 1.6)
  ctx.quadraticCurveTo(-2.1, y + 2, 0, y + 2.6)
  ctx.quadraticCurveTo(2.1, y + 2, 2.5, y - 1.6)
  ctx.closePath()
  ctx.fill()
  // Sepal tips, turned back.
  ctx.beginPath()
  ctx.moveTo(-2.4, y - 1.2)
  ctx.lineTo(-4.3, y + 0.6)
  ctx.lineTo(-1.8, y + 0.2)
  ctx.moveTo(2.4, y - 1.2)
  ctx.lineTo(4.3, y + 0.6)
  ctx.lineTo(1.8, y + 0.2)
  ctx.fill()
}

function paintKind(ctx: CanvasRenderingContext2D, pal: Palette, kind: FlowerKind, variant: number) {
  const rnd = seeded(97 + variant * 131 + kind.length * 7)
  switch (kind) {
    case 'open': {
      const spin = rnd() * Math.PI
      const mats = Array.from({ length: 5 }, (_, i) => {
        const s = 0.9 + rnd() * 0.17
        return rotScale(spin + (i * Math.PI * 2) / 5 + (rnd() - 0.5) * 0.22, s * (0.92 + rnd() * 0.16), s)
      })
      drawPetals(ctx, pal, mats, 0, 0, 10.5)
      drawStamens(ctx, pal, rnd, 24, 0.9, [3.4, 5.2])
      break
    }
    case 'back': {
      const spin = rnd() * Math.PI
      const mats = Array.from({ length: 5 }, (_, i) => rotScale(spin + (i * Math.PI * 2) / 5, 0.95, 0.97))
      drawPetals(ctx, pal, mats, 0, 0, 10.5)
      // The underside is paler, and the calyx sits in the middle like a star.
      ctx.fillStyle = 'rgba(255,255,255,0.18)'
      for (const m of mats) ctx.fill(petalPath(m))
      ctx.fillStyle = pal.calyx
      ctx.globalAlpha *= 0.75
      for (let i = 0; i < 5; i++) {
        const a = spin + ((i + 0.5) * Math.PI * 2) / 5
        const tip = [Math.sin(a) * 3.4, -Math.cos(a) * 3.4]
        const l = [Math.sin(a - 0.5) * 1.3, -Math.cos(a - 0.5) * 1.3]
        const r = [Math.sin(a + 0.5) * 1.3, -Math.cos(a + 0.5) * 1.3]
        ctx.beginPath()
        ctx.moveTo(l[0], l[1])
        ctx.quadraticCurveTo(tip[0] * 0.6 - 0.4, tip[1] * 0.6, tip[0], tip[1])
        ctx.quadraticCurveTo(tip[0] * 0.6 + 0.4, tip[1] * 0.6, r[0], r[1])
        ctx.fill()
      }
      ctx.beginPath()
      ctx.arc(0, 0, 1.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha /= 0.75
      break
    }
    case 'side': {
      // Seen from the side: a shallow cup on its calyx, stamens poking out.
      const back = [-0.42, 0.42].map((a) => rotScale(a, 0.9, 0.88, 0, -1.8))
      drawPetals(ctx, pal, back, 0, -2, 10)
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      for (const m of back) ctx.fill(petalPath(m))
      drawStamens(ctx, pal, rnd, 12, 0.4, [5.5, 7.4], 1.5, 0, 0, -1.6, 1)
      const front = [
        rotScale(-1.05, 0.95, 0.8, 0, -1.2),
        rotScale(1.05, 0.95, 0.8, 0, -1.2),
        rotScale(0, 1, 0.55, 0, -0.9),
      ]
      drawPetals(ctx, pal, front, 0, -1, 9.5)
      calyxCup(ctx, pal, 0.4)
      break
    }
    case 'half': {
      // Just opening: petals still cupped and pinker.
      const mats = [-0.55, 0.55, -0.22, 0.22, 0].map((a, i) => rotScale(a, 0.72, i === 4 ? 0.62 : 0.86, 0, -1.2))
      drawPetals(ctx, pal, mats, 0, -1, 8, 1)
      ctx.fillStyle = pal.eye
      ctx.globalAlpha *= 0.18
      for (const m of mats) ctx.fill(petalPath(m))
      ctx.globalAlpha /= 0.18
      calyxCup(ctx, pal, 0.2)
      break
    }
    case 'bud': {
      const g = ctx.createLinearGradient(0, 0, 0, -9)
      g.addColorStop(0, pal.eye)
      g.addColorStop(0.55, pal.petalCore)
      g.addColorStop(1, pal.petalMid)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(0, -9.2)
      ctx.bezierCurveTo(3.3, -6.6, 3.5, -2.4, 0, -0.6)
      ctx.bezierCurveTo(-3.5, -2.4, -3.3, -6.6, 0, -9.2)
      ctx.fill()
      ctx.strokeStyle = pal.rim
      ctx.lineWidth = 0.3
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, -8.4)
      ctx.quadraticCurveTo(1.2, -4.6, 0.3, -1.4)
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'
      ctx.lineWidth = 0.35
      ctx.stroke()
      calyxCup(ctx, pal, -0.4)
      break
    }
  }
}

function paintLeaf(ctx: CanvasRenderingContext2D, pal: Palette) {
  const g = ctx.createLinearGradient(0, 0, 0, -13)
  g.addColorStop(0, pal.leafB)
  g.addColorStop(1, pal.leafA)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(3.4, -2.6, 4, -8.5, 0, -12.8)
  ctx.bezierCurveTo(-4, -8.5, -3.4, -2.6, 0, 0)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(0, -0.5)
  ctx.lineTo(0, -11.5)
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.lineWidth = 0.3
  ctx.stroke()
}

export interface Sprites {
  flowers: Record<FlowerKind, HTMLCanvasElement[]>
  leaf: HTMLCanvasElement
  /** Sprite pixels per unit-flower unit. */
  res: number
}

function sprite(res: number, pal: Palette, draw: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas')
  const px = Math.ceil(SPRITE_EXTENT * 2 * res)
  c.width = c.height = px
  const ctx = c.getContext('2d')!
  ctx.translate(px / 2, px / 2)
  ctx.scale(res, res)
  if (pal.night) {
    // Blossom at night catches the lantern light.
    ctx.shadowColor = 'rgba(255, 160, 195, 0.5)'
    ctx.shadowBlur = 5 * res
  }
  draw(ctx)
  return c
}

export function buildSprites(pal: Palette, res: number): Sprites {
  const r = Math.min(8, Math.max(1.5, res))
  const make = (kind: FlowerKind, n: number) =>
    Array.from({ length: n }, (_, v) => sprite(r, pal, (ctx) => paintKind(ctx, pal, kind, v)))
  return {
    flowers: { open: make('open', 4), back: make('back', 1), side: make('side', 1), half: make('half', 1), bud: make('bud', 1) },
    leaf: sprite(r, pal, (ctx) => paintLeaf(ctx, pal)),
    res: r,
  }
}

// --- Frame --------------------------------------------------------------

export interface LimbPaths {
  outline: Path2D
  light: Path2D
  shade: Path2D
  lenticels: Path2D
}

export function limbPaths(plan: BranchPlan): LimbPaths[] {
  return plan.limbs.map((l) => ({
    outline: new Path2D(l.outline),
    light: new Path2D(l.light),
    shade: new Path2D(l.shade),
    lenticels: new Path2D(l.lenticels),
  }))
}

export interface FrameState {
  /** Per limb: plan units → canvas pixels. */
  mats: Mat[]
  /** Per limb, per flower: how open (0..1+, may overshoot). */
  bloom: (limb: Limb, f: Flower, i: number) => number
  /** Per limb, per flower: sway about its stalk, radians. */
  nod: (limb: Limb, f: Flower, i: number) => number
  leafGrow: (limb: Limb, lf: Leaf) => number
  /** Per limb: 0 before it has grown out, 1 after. */
  grown: number[]
}

function flowerAt(f: Flower, nod: number): [number, number] {
  if (!nod) return [f.x, f.y]
  const c = Math.cos(nod)
  const s = Math.sin(nod)
  const dx = f.x - f.ax
  const dy = f.y - f.ay
  return [f.ax + dx * c - dy * s, f.ay + dx * s + dy * c]
}

export { flowerAt }

function drawFlowers(ctx: CanvasRenderingContext2D, sprites: Sprites, limb: Limb, m: Mat, state: FrameState, front: boolean, pal: Palette) {
  // Stalks first, so open flowers hide where theirs meet the petals.
  ctx.setTransform(...m)
  ctx.beginPath()
  limb.flowers.forEach((f, i) => {
    if (f.front !== front) return
    const b = state.bloom(limb, f, i)
    if (b <= 0.02) return
    const [x, y] = flowerAt(f, state.nod(limb, f, i))
    const k = Math.min(1, b)
    const ex = f.ax + (x - f.ax) * k
    const ey = f.ay + (y - f.ay) * k
    ctx.moveTo(f.ax, f.ay)
    ctx.quadraticCurveTo((f.ax + ex) / 2, (f.ay + ey) / 2 + Math.hypot(ex - f.ax, ey - f.ay) * 0.16, ex, ey)
  })
  ctx.strokeStyle = pal.pedicel
  ctx.lineWidth = 0.75
  ctx.lineCap = 'round'
  ctx.stroke()

  const E = SPRITE_EXTENT
  limb.flowers.forEach((f, i) => {
    if (f.front !== front) return
    const b = state.bloom(limb, f, i)
    if (b <= 0.02) return
    const nod = state.nod(limb, f, i)
    const [x0, y0] = flowerAt(f, nod)
    const k = Math.min(1, b)
    const x = f.ax + (x0 - f.ax) * k
    const y = f.ay + (y0 - f.ay) * k
    const s = f.size * b
    // Opening flowers turn a little as they unfurl.
    const rot = f.rot + nod + (1 - k) * 0.7
    const c = Math.cos(rot)
    const sn = Math.sin(rot)
    const local: Mat = [c * s, sn * s, -sn * s * f.squash, c * s * f.squash, x, y]
    ctx.setTransform(...mul(m, local))
    ctx.drawImage(sprites.flowers[f.kind][f.variant] ?? sprites.flowers[f.kind][0], -E, -E, E * 2, E * 2)
  })
}

export function mul(a: Mat, b: Mat): Mat {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ]
}

export function paintFrame(
  ctx: CanvasRenderingContext2D,
  plan: BranchPlan,
  paths: LimbPaths[],
  sprites: Sprites,
  pal: Palette,
  state: FrameState,
) {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  plan.limbs.forEach((limb, i) => {
    if (state.grown[i] <= 0) return
    const m = state.mats[i]
    drawFlowers(ctx, sprites, limb, m, state, false, pal)

    ctx.setTransform(...m)
    const p = paths[i]
    ctx.fillStyle = pal.barkBase
    ctx.fill(p.outline)
    ctx.globalAlpha = 0.6
    ctx.fillStyle = pal.barkDark
    ctx.fill(p.shade)
    ctx.globalAlpha = 0.55
    ctx.fillStyle = pal.barkLight
    ctx.fill(p.light)
    ctx.globalAlpha = 0.5
    ctx.strokeStyle = pal.lenticel
    ctx.lineWidth = 0.7
    ctx.lineCap = 'round'
    ctx.stroke(p.lenticels)
    ctx.globalAlpha = 1

    for (const lf of limb.leaves) {
      const g = state.leafGrow(limb, lf)
      if (g <= 0) continue
      const c = Math.cos(lf.rot)
      const s = Math.sin(lf.rot)
      const k = lf.size * g
      ctx.setTransform(...mul(m, [c * k, s * k, -s * k, c * k, lf.x, lf.y]))
      ctx.drawImage(sprites.leaf, -SPRITE_EXTENT, -SPRITE_EXTENT, SPRITE_EXTENT * 2, SPRITE_EXTENT * 2)
    }

    drawFlowers(ctx, sprites, limb, m, state, true, pal)
  })
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

export type { Mat }
