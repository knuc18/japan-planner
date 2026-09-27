import { useEffect, useMemo, useRef } from 'react'
import { GROW_SECONDS, planBranch, type BranchOptions, type Flower, type Limb } from '../lib/branch'
import { buildSprites, flowerAt, limbPaths, mul, paintFrame, readPalette, type Mat } from '../lib/branchPaint'
import { getWind, releasePetals } from '../lib/petals'
import { prefersReducedMotion } from '../lib/motion'

// Two hand-picked seeds. The left branch is the hero's main frame and keeps
// clear of the headline; the right one is smaller and grows the other way.
const PRESETS: Record<'left' | 'right', BranchOptions> = {
  left: {
    seed: 606,
    width: 560,
    height: 230,
    start: [-24, 20],
    angle: 0.2,
    length: 470,
    thickness: 17,
    density: 1.05,
    avoid: { x0: 150, y0: 150, x1: 560, y1: 230 },
  },
  right: {
    seed: 14,
    width: 420,
    height: 210,
    start: [-22, 12],
    angle: 0.3,
    length: 330,
    thickness: 13,
    density: 0.85,
    mirror: true,
  },
}

// Spring tuning per depth (0 = the limb entering the frame): thick wood is
// stiff and barely moves; the spurs carrying flowers swing freely.
const STIFF = [42, 26, 18, 14]
const DAMP = [6, 3.4, 2.5, 2.1]
const SAIL = [0.00012, 0.0005, 0.0009, 0.0012]
const LIMIT = [0.03, 0.12, 0.22, 0.28]
const FLUTTER = [0.0015, 0.007, 0.013, 0.017]
const SHAKE = [0.15, 0.9, 1.5, 1.8]

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const easeOutBack = (t: number) => {
  const c = 1.7
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax
  const dy = by - ay
  const l2 = dx * dx + dy * dy || 1
  const u = clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1)
  return Math.hypot(px - (ax + dx * u), py - (ay + dy * u))
}

/**
 * A cherry branch drawn on canvas and moved limb by limb. Each limb is a
 * damped spring about its joint, pushed by the same wind that carries the
 * falling petals, so gusts bend the twigs and shake blossom loose. Brushing
 * the cursor through it pushes the twigs aside; clicking shakes it.
 */
export default function SakuraBranch({ side = 'left', delay = 0 }: { side?: 'left' | 'right'; delay?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const plan = useMemo(() => planBranch(PRESETS[side]), [side])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const limbs = plan.limbs
    const n = limbs.length
    const paths = limbPaths(plan)
    const theta = new Float64Array(n)
    const omega = new Float64Array(n)
    const mats: Mat[] = Array.from({ length: n }, () => [1, 0, 0, 1, 0, 0] as Mat)
    const grown = new Array<number>(n).fill(0)
    const sheddable: [number, number][] = []
    limbs.forEach((l, i) =>
      l.flowers.forEach((f, k) => {
        if (f.kind !== 'bud' && f.kind !== 'half') sheddable.push([i, k])
      }),
    )

    let pal = readPalette()
    let scale = 1
    let dpr = 1
    let sprites = buildSprites(pal, 2)
    const born = performance.now() + delay
    let age = 0
    let clock = 0
    let settled = prefersReducedMotion()
    let raf = 0
    let last = 0
    let visible = true
    let rect = canvas.getBoundingClientRect()
    // Gentle sway reads fine at half rate; growing, gusts and a brushing
    // cursor get every frame.
    let lively = 0
    let frame = 0

    const bloom = (_l: Limb, f: Flower) => (settled ? 1 : easeOutBack(clamp((age - f.delay) / 0.8, 0, 1)))
    const nod = (_l: Limb, f: Flower) => {
      if (settled) return 0
      const w = getWind()
      return 0.05 * Math.sin(clock * 1.6 + f.phase) * (0.5 + w.gust * 2 + Math.abs(w.speed) / 120)
    }
    const leafGrow = (_l: Limb, lf: { delay: number }) => (settled ? 1 : easeOutCubic(clamp((age - lf.delay) / 0.7, 0, 1)))

    function updateMatrices() {
      const k = scale * dpr
      const base: Mat = [k, 0, 0, k, 0, 0]
      for (let i = 0; i < n; i++) {
        const l = limbs[i]
        grown[i] = settled ? 1 : easeOutCubic(clamp((age - l.delay) / GROW_SECONDS, 0, 1))
        const g = Math.max(0.0001, grown[i])
        const c = Math.cos(theta[i]) * g
        const s = Math.sin(theta[i]) * g
        const [px, py] = l.pivot
        const local: Mat = [c, s, -s, c, px - (c * px - s * py), py - (s * px + c * py)]
        mats[i] = mul(l.parent < 0 ? base : mats[l.parent], local)
      }
    }

    /** Current position of a plan point on limb i, in plan units. */
    function planPoint(i: number, x: number, y: number): [number, number] {
      const m = mats[i]
      const k = scale * dpr
      return [(m[0] * x + m[2] * y + m[4]) / k, (m[1] * x + m[3] * y + m[5]) / k]
    }

    function draw() {
      updateMatrices()
      paintFrame(ctx!, plan, paths, sprites, pal, { mats, grown, bloom, nod, leafGrow })
    }

    function shed(i: number, k: number, count = 1, force = 40) {
      const f = limbs[i].flowers[k]
      if (bloom(limbs[i], f) < 1) return
      const [fx, fy] = flowerAt(f, nod(limbs[i], f))
      const [x, y] = planPoint(i, fx, fy)
      releasePetals({ x: rect.left + x * scale, y: rect.top + y * scale, count, force })
    }

    function step(now: number) {
      raf = 0
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016)
      last = now
      age = (now - born) / 1000
      clock += dt
      const w = getWind()

      for (let i = 0; i < n; i++) {
        const l = limbs[i]
        const d = Math.min(3, l.depth)
        const rx = l.tip[0] - l.pivot[0]
        const ry = l.tip[1] - l.pivot[1]
        // A sideways wind swings hanging limbs; level ones mostly bob.
        const push = -ry / (Math.hypot(rx, ry) || 1)
        const flutter =
          FLUTTER[d] *
          (Math.sin(clock * (1.1 + (i % 7) * 0.23) + i * 1.7) + 0.5 * Math.sin(clock * (2.3 + (i % 5) * 0.31) + i)) *
          (0.6 + w.gust * 2 + Math.abs(w.speed) / 140)
        const target = clamp(push * w.speed * SAIL[d] + flutter, -LIMIT[d], LIMIT[d])
        omega[i] += (STIFF[d] * (target - theta[i]) - DAMP[d] * omega[i]) * dt
        theta[i] = clamp(theta[i] + omega[i] * dt, -LIMIT[d] * 2.5, LIMIT[d] * 2.5)
      }

      // Blossom lets go of petals now and then, and in handfuls when it gusts.
      if (age > 2.5 && sheddable.length && Math.random() < dt * (0.3 + w.gust * 4)) {
        rect = canvas!.getBoundingClientRect()
        const [i, k] = sheddable[Math.floor(Math.random() * sheddable.length)]
        shed(i, k, 1, 30 + w.gust * 60)
      }

      frame++
      lively = Math.max(0, lively - dt)
      const busy = age < 3.5 || lively > 0 || w.gust > 0.25
      if (busy || frame % 2 === 0) draw()
      if (visible && !document.hidden && !settled) raf = requestAnimationFrame(step)
    }

    function start() {
      if (raf || !visible || document.hidden || settled) return
      last = performance.now()
      raf = requestAnimationFrame(step)
    }

    function stop() {
      cancelAnimationFrame(raf)
      raf = 0
    }

    function resize() {
      rect = canvas!.getBoundingClientRect()
      if (!rect.width) return
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      scale = rect.width / plan.width
      canvas!.width = Math.round(rect.width * dpr)
      canvas!.height = Math.round(((rect.width * plan.height) / plan.width) * dpr)
      sprites = buildSprites(pal, scale * dpr * 1.3)
      draw()
    }

    // --- Brushing and shaking ---------------------------------------------

    const pointer = { x: 0, y: 0, t: 0 }

    function toPlan(e: PointerEvent): [number, number] | null {
      rect = canvas!.getBoundingClientRect()
      const x = (e.clientX - rect.left) / scale
      const y = (e.clientY - rect.top) / scale
      if (x < -30 || y < -30 || x > plan.width + 30 || y > plan.height + 30) return null
      return [x, y]
    }

    function onMove(e: PointerEvent) {
      if (settled) return
      const p = toPlan(e)
      const now = performance.now()
      if (!p) {
        pointer.t = 0
        return
      }
      const dtp = (now - pointer.t) / 1000
      const fresh = pointer.t && dtp > 0 && dtp < 0.12
      const vx = fresh ? (p[0] - pointer.x) / dtp : 0
      const vy = fresh ? (p[1] - pointer.y) / dtp : 0
      pointer.x = p[0]
      pointer.y = p[1]
      pointer.t = now
      if (!fresh) return
      const speed = Math.hypot(vx, vy)
      lively = 1.5

      for (let i = 0; i < n; i++) {
        const l = limbs[i]
        if (l.depth === 0) continue
        const [ax, ay] = planPoint(i, l.pivot[0], l.pivot[1])
        const [bx, by] = planPoint(i, l.tip[0], l.tip[1])
        const reach = 16 + l.widths[0]
        const dist = distToSegment(p[0], p[1], ax, ay, bx, by)
        if (dist > reach) continue
        const rx = bx - ax
        const ry = by - ay
        const falloff = 1 - dist / reach
        // Push the limb the way the cursor is moving, like a hand through leaves.
        omega[i] = clamp(omega[i] + ((rx * vy - ry * vx) / (rx * rx + ry * ry + 1)) * 0.06 * falloff, -3, 3)
      }

      if (speed > 280) {
        let shedCount = 0
        for (const [i, k] of sheddable) {
          const f = limbs[i].flowers[k]
          const [fx, fy] = planPoint(i, f.x, f.y)
          if (Math.hypot(fx - p[0], fy - p[1]) < 16 && Math.random() < 0.18) {
            shed(i, k, 1, 60 + speed * 0.1)
            if (++shedCount >= 3) break
          }
        }
      }
    }

    function onDown(e: PointerEvent) {
      if (settled) return
      const p = toPlan(e)
      if (!p) return
      // Only a click that lands on the branch or its blossom shakes it.
      let near: [number, number, number][] = []
      for (const [i, k] of sheddable) {
        const f = limbs[i].flowers[k]
        const [fx, fy] = planPoint(i, f.x, f.y)
        const d = Math.hypot(fx - p[0], fy - p[1])
        if (d < 40) near.push([d, i, k])
      }
      const hit =
        near.some(([d]) => d < 13) ||
        limbs.some((l, i) => {
          const [ax, ay] = planPoint(i, l.pivot[0], l.pivot[1])
          const [bx, by] = planPoint(i, l.tip[0], l.tip[1])
          return distToSegment(p[0], p[1], ax, ay, bx, by) < l.widths[0] / 2 + 4
        })
      if (!hit) return
      lively = 3
      for (let i = 0; i < n; i++) {
        omega[i] += (Math.random() - 0.5) * 2 * SHAKE[Math.min(3, limbs[i].depth)]
      }
      near = near.sort((a, b) => a[0] - b[0]).slice(0, 10)
      for (const [, i, k] of near) shed(i, k, 1 + (Math.random() < 0.4 ? 1 : 0), 140)
    }

    // --- Lifecycle ----------------------------------------------------------

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
      else stop()
    })
    io.observe(canvas)

    const themeObserver = new MutationObserver(() => {
      pal = readPalette()
      sprites = buildSprites(pal, scale * dpr * 1.3)
      draw()
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)')
    const onMotion = () => {
      settled = motionQuery.matches
      if (settled) {
        stop()
        theta.fill(0)
        omega.fill(0)
        draw()
      } else start()
    }
    const onVisibility = () => (document.hidden ? stop() : start())

    motionQuery.addEventListener('change', onMotion)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })

    resize()
    start()

    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
      themeObserver.disconnect()
      motionQuery.removeEventListener('change', onMotion)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [plan, delay])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="block h-auto w-full"
      style={{ aspectRatio: `${plan.width} / ${plan.height}` }}
    />
  )
}
