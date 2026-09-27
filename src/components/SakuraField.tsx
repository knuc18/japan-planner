import { useEffect, useRef } from 'react'
import { onPetalBurst, setWind } from '../lib/petals'
import { prefersReducedMotion } from '../lib/motion'

// ---------------------------------------------------------------------------
// Sakura field
//
// One simulation, two canvases. The back canvas sits behind the page text and
// carries almost every petal; the front canvas holds a handful of large,
// out-of-focus petals that drift past the lens while the hero is on screen,
// which is what sells the depth.
//
// Each petal is a pre-rendered sprite drawn through a 2D matrix: rotation for
// spin, and a squash on one axis driven by cos(flip) so it tumbles and shows
// its paler underside when it turns over. Petals fall slower when they're
// face-on to the air and faster edge-on, which is most of why real ones
// flutter instead of sliding down in straight lines.
// ---------------------------------------------------------------------------

interface Tint {
  edge: string
  mid: string
  base: string
}

const DAY_TINTS: Tint[] = [
  { edge: '#fff2f5', mid: '#f7c3d2', base: '#e2819f' },
  { edge: '#fde6ee', mid: '#f2adc2', base: '#d86a8c' },
  { edge: '#ffffff', mid: '#fad6e0', base: '#eb98b1' },
]

const NIGHT_TINTS: Tint[] = [
  { edge: '#fff4f7', mid: '#f9cddb', base: '#ef93b0' },
  { edge: '#fdebf2', mid: '#f6bccf', base: '#e682a3' },
  { edge: '#ffffff', mid: '#fde2ea', base: '#f3a9c0' },
]

interface Petal {
  x: number
  y: number
  /** 0 = far away, 1 = right in front of the lens. */
  z: number
  size: number
  vx: number
  vy: number
  rot: number
  spin: number
  flip: number
  flipRate: number
  tumble: number
  tumbleRate: number
  sway: number
  swayRate: number
  swayAmp: number
  fall: number
  alpha: number
  tint: number
  /** Fades in from <=0 to 1; negative values act as a start delay. */
  life: number
  /** Extra tumble from gusts, scroll and the cursor; decays back to zero. */
  excite: number
  front: boolean
}

// Sprite geometry: the petal fills this fraction of its square sprite, leaving
// room for blur and glow.
const SPRITE = 72
const FILL = 0.62

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function lighten(hex: string, amount: number) {
  const [r, g, b] = hexToRgb(hex)
  const mix = (c: number) => Math.round(c + (255 - c) * amount)
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`
}

/** A sakura petal: an obovate blade with the small notch at its tip. Unit box, tip up. */
function tracePetal(ctx: CanvasRenderingContext2D) {
  ctx.beginPath()
  ctx.moveTo(0, 0.5)
  ctx.bezierCurveTo(-0.3, 0.33, -0.46, 0.02, -0.33, -0.27)
  ctx.bezierCurveTo(-0.25, -0.45, -0.11, -0.51, -0.045, -0.43)
  ctx.lineTo(0, -0.33)
  ctx.lineTo(0.045, -0.43)
  ctx.bezierCurveTo(0.11, -0.51, 0.25, -0.45, 0.33, -0.27)
  ctx.bezierCurveTo(0.46, 0.02, 0.3, 0.33, 0, 0.5)
  ctx.closePath()
}

function makeSprite(tint: Tint, back: boolean, blur: number, glow: boolean): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = c.height = SPRITE
  const ctx = c.getContext('2d')!
  const s = SPRITE * FILL
  ctx.translate(SPRITE / 2, SPRITE / 2)
  if (blur) ctx.filter = `blur(${blur}px)`
  if (glow) {
    ctx.shadowColor = 'rgba(255, 150, 190, 0.75)'
    ctx.shadowBlur = SPRITE * 0.14
  }
  ctx.scale(s, s)

  // Palest at the tip, blushing toward the base where it met the flower.
  const g = ctx.createRadialGradient(0, 0.46, 0.02, 0, 0.2, 0.85)
  const base = back ? lighten(tint.base, 0.4) : tint.base
  const mid = back ? lighten(tint.mid, 0.35) : tint.mid
  const edge = back ? lighten(tint.edge, 0.3) : tint.edge
  g.addColorStop(0, base)
  g.addColorStop(0.42, mid)
  g.addColorStop(1, edge)
  tracePetal(ctx)
  ctx.fillStyle = g
  ctx.fill()

  ctx.shadowBlur = 0
  // A hairline edge keeps pale petals legible against pale paper.
  ctx.lineWidth = 0.018
  ctx.strokeStyle = back ? 'rgba(214, 112, 140, 0.18)' : 'rgba(200, 90, 125, 0.26)'
  ctx.stroke()

  if (!back) {
    // The centre vein, barely there.
    ctx.beginPath()
    ctx.moveTo(0, 0.46)
    ctx.quadraticCurveTo(0.02, 0.05, 0, -0.3)
    ctx.lineWidth = 0.02
    ctx.strokeStyle = 'rgba(205, 95, 130, 0.22)'
    ctx.stroke()
  }
  return c
}

/** sprites[tint][side][focus] — side 0 = face, 1 = underside; focus 0 = sharp, 1 = soft. */
function buildSprites(night: boolean) {
  const tints = night ? NIGHT_TINTS : DAY_TINTS
  return tints.map((t) =>
    [false, true].map((back) => [makeSprite(t, back, 0, night), makeSprite(t, back, 3.2, night)]),
  )
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const smooth = (t: number) => t * t * (3 - 2 * t)

export default function SakuraField() {
  const backRef = useRef<HTMLCanvasElement>(null)
  const frontRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const back = backRef.current
    const front = frontRef.current
    if (!back || !front) return
    const bctx = back.getContext('2d')
    const fctx = front.getContext('2d')
    if (!bctx || !fctx) return

    let W = 0
    let H = 0
    let dpr = 1
    let small = false
    let maxBack = 0
    let maxFront = 0

    let night = document.documentElement.dataset.theme === 'dark'
    let sprites = buildSprites(night)

    const petals: Petal[] = []
    let running = false
    let raf = 0
    let last = 0
    let clock = 0
    let lastSpawn = 0
    let lastScroll = scrollY

    // Wind: two slow sines for a breathing breeze, plus occasional gusts.
    let gustStart = -99
    let gustAmp = 0
    let nextGust = 2.4 // the first gust lands just after the hero finishes arriving

    const pointer = { x: -9999, y: -9999, vx: 0, vy: 0, t: 0 }

    function resize() {
      // Petals are soft-edged; past 1.5x the extra pixels cost more than they show.
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      W = window.innerWidth
      H = window.innerHeight
      for (const c of [back!, front!]) {
        c.width = Math.round(W * dpr)
        c.height = Math.round(H * dpr)
      }
      small = W < 700
      maxBack = small ? 30 : 68
      maxFront = small ? 2 : 6
    }

    /** 1 over the hero, easing down to a light drift over the rest of the page. */
    function intensity(sy = scrollY) {
      const t = Math.min(1, sy / Math.max(1, H * 0.9))
      return { back: 1 - 0.7 * smooth(t), front: Math.max(0, 1 - t * 1.6) }
    }

    function spawn(front: boolean, opts: Partial<Petal> = {}): Petal {
      const z = front ? 1 : Math.pow(Math.random(), 0.8) * 0.86
      const size = front ? rand(24, 40) : (6 + z * 12.5) * rand(0.85, 1.18)
      const p: Petal = {
        x: rand(-0.15, 1.05) * W,
        y: -size * 2 - rand(0, 60),
        z,
        size,
        vx: 0,
        vy: 0,
        rot: rand(0, Math.PI * 2),
        spin: rand(-0.9, 0.9),
        flip: rand(0, Math.PI * 2),
        flipRate: rand(0.9, 2.6) * (Math.random() < 0.5 ? -1 : 1),
        tumble: rand(0, Math.PI * 2),
        tumbleRate: rand(0.4, 1.3),
        sway: rand(0, Math.PI * 2),
        swayRate: rand(0.6, 1.5),
        swayAmp: rand(10, 30),
        fall: 24 + size * 1.5,
        alpha: front ? rand(0.3, 0.46) : z < 0.16 ? rand(0.35, 0.5) : rand(0.78, 0.95),
        tint: Math.floor(Math.random() * 3),
        life: 0,
        excite: 0,
        front,
        ...opts,
      }
      p.vy = p.fall * 0.6
      return p
    }

    function populate() {
      const n = Math.round(maxBack * intensity().back * 0.8)
      for (let i = 0; i < n; i++) {
        petals.push(spawn(false, { y: rand(-0.05, 1) * H, life: -rand(0, 2.6) }))
      }
      for (let i = 0; i < Math.round(maxFront * intensity().front * 0.5); i++) {
        petals.push(spawn(true, { y: rand(0, 0.8) * H, life: -rand(0.8, 3.5) }))
      }
    }

    function wind(t: number) {
      if (t > nextGust) {
        gustStart = t
        gustAmp = rand(45, 110)
        nextGust = t + rand(7, 15)
      }
      const u = t - gustStart
      const env = u < 1.3 ? smooth(u / 1.3) : Math.exp(-(u - 1.3) / 1.8)
      const gust = u >= 0 && u < 9 ? gustAmp * env : 0
      return { speed: 14 + 16 * Math.sin(t * 0.17) + 9 * Math.sin(t * 0.43 + 1.7) + gust, gust: gust / 110 }
    }

    function step(now: number) {
      raf = 0
      if (!running) return
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016)
      last = now
      clock += dt
      const t = clock

      const { speed: w, gust } = wind(t)
      setWind(w, gust)
      const sy = scrollY
      const inten = intensity(sy)

      // Scrolling moves the page under the petals; shift them with it, more
      // for near ones than far ones, and let a hard scroll stir them up.
      const dScroll = sy - lastScroll
      lastScroll = sy
      const scrollStir = Math.min(1, Math.abs(dScroll) / 60)

      // Pointer velocity fades out once the cursor rests.
      const pointerAge = now - pointer.t
      const pFade = Math.max(0, 1 - pointerAge / 400)
      const R = small ? 110 : 170

      let aliveBack = 0
      let aliveFront = 0
      for (const p of petals) {
        if (p.front) aliveFront++
        else aliveBack++
      }

      const targetBack = Math.round(maxBack * inten.back)
      const targetFront = Math.round(maxFront * inten.front)

      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i]
        const depth = 0.55 + p.z * 0.75

        p.life = Math.min(1, p.life + dt / 1.1)
        p.excite = Math.max(0, p.excite - dt * 1.4)
        p.excite = Math.max(p.excite, gust * 0.8, scrollStir * (0.5 + p.z))

        const flutter = 1 + p.excite * 1.8
        p.flip += p.flipRate * dt * flutter
        p.rot += p.spin * dt * (1 + p.excite)
        p.tumble += p.tumbleRate * dt * flutter
        p.sway += p.swayRate * dt

        const faceOn = Math.abs(Math.cos(p.flip))
        const fall = p.fall * depth * (1.2 - 0.5 * faceOn)
        const drift = w * depth + Math.sin(p.sway) * p.swayAmp * (0.6 + 0.4 * faceOn)

        p.vx += (drift - p.vx) * Math.min(1, dt * 1.6)
        p.vy += (fall - p.vy) * Math.min(1, dt * 1.3)

        if (pFade > 0) {
          const dx = p.x - pointer.x
          const dy = p.y - pointer.y
          const d2 = dx * dx + dy * dy
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1
            const f = (1 - d / R) ** 2 * pFade * (p.front ? 0.6 : 0.4 + p.z)
            p.vx += (pointer.vx * 0.9 + (dx / d) * 260) * f * dt * 4
            p.vy += (pointer.vy * 0.9 + (dy / d) * 260) * f * dt * 4
            p.excite = Math.min(2, p.excite + f * 3)
          }
        }

        p.x += p.vx * dt
        p.y += p.vy * dt - dScroll * (p.front ? 0.9 : 0.2 + p.z * 0.75)

        const gone = p.y > H + 70 || p.x > W + 90 || p.x < -140 || p.y < -160
        if (!gone) continue

        const surplus = p.front ? aliveFront > targetFront : aliveBack > targetBack
        if (surplus) {
          petals.splice(i, 1)
          if (p.front) aliveFront--
          else aliveBack--
          continue
        }
        // Recycle in place. Scrolling down means new petals arrive from below.
        const fresh = spawn(p.front)
        if (p.y < -160 && dScroll > 0) {
          fresh.y = H + rand(10, 60)
          fresh.life = 0.4
        } else if (w > 40) {
          fresh.x = rand(-0.35, 0.8) * W
        }
        petals[i] = fresh
      }

      // Top up toward the target a petal at a time, so they arrive as a drift
      // rather than a sheet.
      if (t - lastSpawn > (small ? 0.22 : 0.09)) {
        if (aliveBack < targetBack) {
          petals.push(spawn(false))
          lastSpawn = t
        } else if (aliveFront < targetFront && Math.random() < 0.02) {
          petals.push(spawn(true))
          lastSpawn = t
        }
      }

      draw()
      raf = requestAnimationFrame(step)
    }

    // The front layer is empty once the hero scrolls away; don't keep
    // clearing a full-screen canvas that has nothing on it.
    let frontDrawn = true

    function draw() {
      const frontHas = petals.some((p) => p.front && p.life > 0)
      bctx!.setTransform(1, 0, 0, 1, 0, 0)
      bctx!.clearRect(0, 0, back!.width, back!.height)
      if (frontHas || frontDrawn) {
        fctx!.setTransform(1, 0, 0, 1, 0, 0)
        fctx!.clearRect(0, 0, front!.width, front!.height)
      }
      frontDrawn = frontHas
      for (const p of petals) {
        if (p.life <= 0) continue
        const ctx = p.front ? fctx! : bctx!
        const f = Math.cos(p.flip)
        const sy = Math.max(0.08, Math.abs(f))
        const sx = 0.7 + 0.3 * Math.abs(Math.cos(p.tumble))
        const cs = Math.cos(p.rot)
        const sn = Math.sin(p.rot)
        const soft = p.front || p.z < 0.16 ? 1 : 0
        const sprite = sprites[p.tint][f >= 0 ? 0 : 1][soft]
        const d = p.size / FILL
        ctx.globalAlpha = p.alpha * smooth(p.life) * (0.7 + 0.3 * sy)
        ctx.setTransform(cs * sx * dpr, sn * sx * dpr, -sn * sy * dpr, cs * sy * dpr, p.x * dpr, p.y * dpr)
        ctx.drawImage(sprite, -d / 2, -d / 2, d, d)
      }
      bctx!.globalAlpha = 1
      fctx!.globalAlpha = 1
    }

    function start() {
      if (running || prefersReducedMotion() || document.hidden) return
      running = true
      last = performance.now()
      lastScroll = scrollY
      raf = requestAnimationFrame(step)
    }

    function stop() {
      running = false
      cancelAnimationFrame(raf)
      raf = 0
    }

    function clearAll() {
      for (const [ctx, c] of [
        [bctx!, back!],
        [fctx!, front!],
      ] as const) {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, c.width, c.height)
      }
    }

    const onPointer = (e: PointerEvent) => {
      const now = performance.now()
      const dt = Math.max(8, now - pointer.t)
      if (pointer.t && now - pointer.t < 120) {
        pointer.vx = pointer.vx * 0.5 + ((e.clientX - pointer.x) / dt) * 1000 * 0.5
        pointer.vy = pointer.vy * 0.5 + ((e.clientY - pointer.y) / dt) * 1000 * 0.5
      } else {
        pointer.vx = pointer.vy = 0
      }
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.t = now
    }

    const onVisibility = () => (document.hidden ? stop() : start())

    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)')
    const onMotionPref = () => {
      if (motionQuery.matches) {
        stop()
        clearAll()
      } else start()
    }

    // Re-tint when the theme flips; night petals carry a lantern-lit glow.
    const themeObserver = new MutationObserver(() => {
      const isNight = document.documentElement.dataset.theme === 'dark'
      if (isNight !== night) {
        night = isNight
        sprites = buildSprites(night)
      }
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    const offBurst = onPetalBurst(({ x, y, count, force = 180 }) => {
      if (!running) return
      for (let i = 0; i < count; i++) {
        const a = rand(-Math.PI, 0.2)
        const speed = rand(0.3, 1) * force
        const p = spawn(false, {
          x: x + rand(-10, 10),
          y: y + rand(-8, 8),
          z: rand(0.45, 0.85),
          life: 0.5,
          excite: 1.5,
        })
        p.size = (5.5 + p.z * 12) * rand(0.9, 1.15)
        p.fall = 24 + p.size * 1.5
        p.vx = Math.cos(a) * speed
        p.vy = Math.sin(a) * speed * 0.7
        petals.push(p)
      }
    })

    resize()
    populate()
    start()

    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointer, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    motionQuery.addEventListener('change', onMotionPref)

    return () => {
      stop()
      offBurst()
      themeObserver.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('visibilitychange', onVisibility)
      motionQuery.removeEventListener('change', onMotionPref)
    }
  }, [])

  return (
    <div className="sakura-field no-print" aria-hidden>
      <canvas ref={backRef} className="pointer-events-none fixed inset-0 z-[1] h-full w-full" />
      <canvas ref={frontRef} className="pointer-events-none fixed inset-0 z-[30] h-full w-full" />
    </div>
  )
}
