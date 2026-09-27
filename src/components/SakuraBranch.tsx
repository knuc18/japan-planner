import { useId, useRef, type CSSProperties, type MouseEvent } from 'react'
import { releasePetals } from '../lib/petals'

const PETAL_ANGLES = [0, 72, 144, 216, 288]
const STAMEN_ANGLES = [18, 66, 118, 170, 222, 274, 326]

// One notched petal, pointing up from the flower's centre.
const PETAL_D =
  'M0 0 C -2.7 -1.5, -3.8 -4.3, -2.3 -6.3 C -1.7 -7.1, -0.75 -7.2, -0.3 -6.6 L 0 -6 L 0.3 -6.6 C 0.75 -7.2, 1.7 -7.1, 2.3 -6.3 C 3.8 -4.3, 2.7 -1.5, 0 0 Z'

interface BlossomSpec {
  x: number
  y: number
  s: number
  r: number
  open?: boolean
}

function Blossom({ x, y, s, r, open = true, grad, delay }: BlossomSpec & { grad: string; delay: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <g className="bloom" style={{ '--delay': `${delay}ms` } as CSSProperties}>
        {open ? (
          <>
            {PETAL_ANGLES.map((a) => (
              <path key={a} d={PETAL_D} transform={`rotate(${a})`} fill={`url(#${grad})`} />
            ))}
            {STAMEN_ANGLES.map((a) => (
              <g key={a} transform={`rotate(${a})`}>
                <line x1="0" y1="0" x2="0" y2="-2.5" stroke="var(--color-sakura-deep)" strokeWidth="0.25" />
                <circle cy="-2.6" r="0.38" fill="#dca64a" />
              </g>
            ))}
            <circle r="0.9" fill="var(--color-sakura-deep)" />
          </>
        ) : (
          // Unopened buds keep the branch from reading as a uniform pom-pom.
          <path d="M0 2.4 C -2 1.2, -2 -2, 0 -3.6 C 2 -2, 2 1.2, 0 2.4 Z" fill="var(--color-sakura-deep)" />
        )}
      </g>
    </g>
  )
}

// Blossom placements are hand-set along the limbs — a scatter function put them
// in mid-air as often as on a branch.
const CLUSTER: BlossomSpec[] = [
  { x: 30, y: 12, s: 0.95, r: 40 },
  { x: 42, y: 26, s: 1.15, r: 12 },
  { x: 70, y: 16, s: 0.85, r: 60, open: false },
  { x: 96, y: 38, s: 1.3, r: 34 },
  { x: 110, y: 22, s: 0.9, r: 5 },
  { x: 128, y: 30, s: 0.95, r: 78 },
  { x: 150, y: 54, s: 1.2, r: 8 },
  { x: 176, y: 44, s: 0.8, r: 45, open: false },
  { x: 196, y: 68, s: 1.35, r: 22 },
  { x: 214, y: 92, s: 1.0, r: 65 },
  { x: 238, y: 74, s: 1.1, r: 15 },
  { x: 258, y: 104, s: 0.85, r: 50, open: false },
  { x: 118, y: 76, s: 1.05, r: 40 },
  { x: 86, y: 92, s: 0.95, r: 25 },
  { x: 72, y: 70, s: 0.7, r: 12, open: false },
  { x: 58, y: 66, s: 1.2, r: 70 },
  { x: 276, y: 130, s: 1.15, r: 33 },
  { x: 266, y: 146, s: 0.75, r: 10, open: false },
  { x: 168, y: 112, s: 0.8, r: 55, open: false },
  { x: 206, y: 100, s: 0.85, r: 80 },
]

const LIMBS = [
  { d: 'M -12 4 C 48 18, 104 20, 152 46 C 196 70, 232 82, 292 128', w: 6.5 },
  { d: 'M 60 14 C 74 34, 78 58, 70 88', w: 3 },
  { d: 'M 118 32 C 128 50, 126 66, 114 82', w: 2.5 },
  { d: 'M 172 56 C 190 62, 204 76, 210 96', w: 2.5 },
  { d: 'M 236 84 C 252 96, 264 114, 268 134', w: 2 },
  { d: 'M 96 24 C 118 18, 140 22, 158 34', w: 2 },
]

export default function SakuraBranch({ flip = false, baseDelay = 0 }: { flip?: boolean; baseDelay?: number }) {
  const grad = `petal-${useId().replace(/:/g, '')}`
  const svgRef = useRef<SVGSVGElement>(null)
  const lastShake = useRef(0)

  // Brushing past the branch shakes a few petals loose; a click shakes it hard.
  function shake(e: MouseEvent<SVGGElement>, count: number) {
    const now = performance.now()
    if (count < 8 && now - lastShake.current < 700) return
    lastShake.current = now
    releasePetals({ x: e.clientX, y: e.clientY, count, force: count > 6 ? 240 : 150 })
    const svg = svgRef.current
    if (!svg) return
    svg.classList.remove('is-rustling')
    void svg.getBoundingClientRect()
    svg.classList.add('is-rustling')
  }

  return (
    <svg
      ref={svgRef}
      viewBox="-14 -4 320 170"
      className="branch-sway w-full h-auto overflow-visible"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      onAnimationEnd={(e) => {
        if (e.animationName === 'rustle') e.currentTarget.classList.remove('is-rustling')
      }}
      aria-hidden
      focusable="false"
    >
      <defs>
        <radialGradient id={grad} cx="0" cy="0" r="7.2" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: 'var(--color-sakura-deep)' }} />
          <stop offset="0.4" style={{ stopColor: 'var(--color-sakura)' }} />
          <stop offset="1" style={{ stopColor: 'color-mix(in srgb, var(--color-sakura) 25%, #fff)' }} />
        </radialGradient>
      </defs>
      <g
        className="stroke-bark cursor-pointer"
        fill="none"
        strokeLinecap="round"
        style={{ pointerEvents: 'auto' }}
        onPointerEnter={(e) => shake(e, 4)}
        onClick={(e) => shake(e, 12)}
      >
        {LIMBS.map((l, i) => (
          <path
            key={i}
            d={l.d}
            strokeWidth={l.w}
            pathLength={1}
            className="limb"
            style={{ '--len': 1, '--delay': `${baseDelay + (i === 0 ? 0 : 300 + i * 90)}ms` } as CSSProperties}
          />
        ))}
      </g>
      <g
        className="cursor-pointer"
        style={{ pointerEvents: 'auto' }}
        onPointerEnter={(e) => shake(e, 5)}
        onClick={(e) => shake(e, 14)}
      >
        {CLUSTER.map((b, i) => (
          <Blossom key={i} {...b} grad={grad} delay={baseDelay + 500 + b.x * 3.2 + (i % 3) * 60} />
        ))}
      </g>
    </svg>
  )
}
