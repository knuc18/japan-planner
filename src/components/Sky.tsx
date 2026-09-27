import type { CSSProperties } from 'react'

// Deterministic scatter so the night sky doesn't rearrange itself on every render.
function seeded(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rnd = seeded(20260401)
const STARS = Array.from({ length: 90 }, () => ({
  x: rnd() * 100,
  y: Math.pow(rnd(), 1.5) * 72,
  r: 0.6 + Math.pow(rnd(), 3) * 1.8,
  dur: 2.4 + rnd() * 5,
  delay: -rnd() * 7,
}))

const SHOOTING = [
  { left: '22%', top: '10%', angle: '-28deg', tx: '-220px', ty: '118px', delay: '4s' },
  { left: '64%', top: '6%', angle: '-22deg', tx: '-260px', ty: '106px', delay: '10.5s' },
]

/** Pagoda silhouette (Chūreitō-style, five tiers), base centred on (cx, by). */
function pagodaPath(cx: number, by: number) {
  const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h${-w}Z`
  let d = rect(cx - 17, by - 4, 34, 4)
  let y = by - 4
  for (let i = 0; i < 5; i++) {
    const bw = 19 - i * 2.4
    const bh = 9 - i * 0.7
    d += rect(cx - bw / 2, y - bh, bw, bh)
    y -= bh
    const rw = 37 - i * 4.6
    const rh = 3.6
    const l = cx - rw / 2
    const r = cx + rw / 2
    // Eaves sweep up at the corners.
    d += `M${l - 3} ${y - 0.2}Q${l + 2} ${y - 0.4} ${l + 5} ${y - rh}L${r - 5} ${y - rh}Q${r - 2} ${y - 0.4} ${r + 3} ${y - 0.2}Z`
    y -= rh
  }
  d += rect(cx - 0.9, y - 20, 1.8, 20)
  for (let k = 0; k < 4; k++) d += rect(cx - 2.4, y - 5 - k * 3.4, 4.8, 1.1)
  return d
}

const PAGODA = pagodaPath(60, 120)

// The near hills are generated from one height function so the treeline of
// cherries in bloom can sit exactly on the ridge it grows from.
const NEAR_W = 1440
const nearY = (x: number) =>
  38 - 16 * Math.sin((x / NEAR_W) * Math.PI * 1.8 - 0.94) - 3 * Math.sin((x / NEAR_W) * Math.PI * 4.6 + 0.4)

function ridgePath() {
  let d = `M0 80 L0 ${nearY(0).toFixed(1)}`
  for (let x = 24; x <= NEAR_W; x += 24) d += ` L${x} ${nearY(x).toFixed(1)}`
  return `${d} L${NEAR_W} 80 Z`
}

function treeline(seed: number, clusters: [number, number][], scale: number, sink: number) {
  const r = seeded(seed)
  let d = ''
  for (const [from, to] of clusters) {
    let x = from
    while (x < to) {
      const w = 14 + r() * 18
      const edge = Math.sin(Math.PI * Math.min(1, Math.max(0, (x + w / 2 - from) / (to - from))))
      const h = (6 + r() * 9) * (0.45 + 0.55 * edge) * scale
      const y0 = nearY(x) + sink
      const y1 = nearY(x + w) + sink
      d += `M${x.toFixed(1)} ${y0.toFixed(1)} A${(w / 2).toFixed(1)} ${h.toFixed(1)} 0 0 1 ${(x + w).toFixed(1)} ${y1.toFixed(1)} Z`
      x += w * (0.45 + r() * 0.25)
    }
  }
  return d
}

const RIDGE_D = ridgePath()
const TREES_BACK = treeline(7, [[0, 250], [300, 560], [700, 1080], [1150, 1440]], 1.35, 4)
const TREES_FRONT = treeline(11, [[20, 200], [360, 540], [860, 1040], [1200, 1420]], 1, 5)

const LANTERN_COUNT = 11

function depth(k: number, dx = 0, dy = 0): CSSProperties {
  return { '--k': k, '--dx': dx, '--dy': dy } as CSSProperties
}

export default function Sky() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="sky-wash absolute inset-0" />

      {/* Stars and the odd shooting star — night only. */}
      <div className="stars depth absolute inset-0" style={depth(0.75, -3, -2)}>
        {STARS.map((s, i) => (
          <span
            key={i}
            className="star absolute rounded-full"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.r * 2,
              height: s.r * 2,
              background: '#fff8ec',
              boxShadow: s.r > 1.5 ? '0 0 6px rgba(255,248,236,0.8)' : undefined,
              animationDuration: `${s.dur}s`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
        {SHOOTING.map((s, i) => (
          <span
            key={i}
            className="shooting-star"
            style={
              {
                left: s.left,
                top: s.top,
                '--angle': s.angle,
                '--tx': s.tx,
                '--ty': s.ty,
                animationDelay: s.delay,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {/* The moon: rises when night falls. */}
      <div className="moon-orbit absolute right-[10%] top-[13%] md:right-[17%] md:top-[12%]">
        <div className="depth" style={depth(0.62, -12, -8)}>
          <div className="relative" style={{ width: 'min(26vw, 200px)', height: 'min(26vw, 200px)' }}>
            <div
              className="halo"
              style={{
                width: '290%',
                height: '290%',
                background:
                  'radial-gradient(circle, color-mix(in srgb, var(--color-moon) 30%, transparent) 0%, color-mix(in srgb, var(--color-moon) 8%, transparent) 38%, transparent 68%)',
              }}
            />
            <div className="moon-disc relative h-full w-full rounded-full" />
            <svg
              className="moon-cloud absolute left-[-45%] top-[58%] w-[190%]"
              viewBox="0 0 400 60"
              style={{ filter: 'blur(2.5px)' }}
            >
              <path
                d="M20 34 C 60 22, 120 26, 160 30 C 200 18, 260 20, 300 28 C 340 26, 372 30, 392 36 C 330 42, 260 40, 200 44 C 140 48, 70 44, 20 34 Z"
                fill="color-mix(in srgb, var(--color-sky-low) 88%, var(--color-moon))"
                opacity="0.92"
              />
              <path
                d="M80 50 C 130 44, 190 46, 240 50 C 200 56, 130 57, 80 50 Z"
                fill="color-mix(in srgb, var(--color-sky-low) 80%, var(--color-moon))"
                opacity="0.7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* The sun: rises on load, sets behind the hills when night falls. */}
      <div className="sun-orbit absolute bottom-[calc(var(--sun)*-0.2)] right-[6%] [--sun:min(42vw,190px)] md:right-[9%] md:[--sun:min(40vw,330px)]">
        <div className="depth" style={depth(0.55, -10, -6)}>
          <div className="sun-rise relative" style={{ width: 'var(--sun)', height: 'var(--sun)' }}>
            <div
              className="halo"
              style={{
                width: '200%',
                height: '200%',
                background:
                  'radial-gradient(circle, color-mix(in srgb, var(--color-sun) 50%, transparent) 0%, color-mix(in srgb, var(--color-sun) 14%, transparent) 42%, transparent 70%)',
              }}
            />
            <div className="sun-disc relative h-full w-full rounded-full" />
          </div>
        </div>
      </div>

      {/* Far hills, stretched to any width. */}
      <div className="depth absolute inset-x-0 bottom-0" style={depth(0.46, -4, -2)}>
        <svg
          className="land-in block w-full"
          style={{ height: 'clamp(70px, 13vh, 118px)', '--delay': '500ms' } as CSSProperties}
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
        >
          <path
            className="ridge-far"
            d="M0 120 L0 58 C 110 40, 210 24, 330 36 C 430 46, 520 14, 640 22 C 760 32, 850 50, 960 42 C 1080 32, 1200 12, 1310 26 C 1370 34, 1410 40, 1440 44 L1440 120 Z"
          />
        </svg>
      </div>

      {/* Fuji, anchored by its peak so it stays framed at any width. */}
      <div className="depth absolute bottom-0 left-[26%] md:left-[63%]" style={depth(0.36, -6, -3)}>
        <svg
          className="land-in block h-[clamp(110px,16vh,150px)] -translate-x-[53%] md:h-[clamp(150px,29vh,290px)]"
          style={{ '--delay': '350ms' } as CSSProperties}
          viewBox="560 100 880 220"
        >
          <path
            className="ridge"
            d="M 560 320 C 780 284, 925 205, 1000 126 L 1012 119 L 1022 123 L 1033 117 L 1047 122 C 1120 196, 1250 282, 1440 314 L 1440 320 Z"
          />
          <path
            className="snow"
            d="M 1000 126 L 1012 119 L 1022 123 L 1033 117 L 1047 122 C 1060 136, 1071 148, 1083 162 L 1072 157 L 1064 170 L 1054 159 L 1044 178 L 1033 161 L 1021 174 L 1011 160 L 998 170 L 988 158 L 973 164 C 983 150, 992 137, 1000 126 Z"
          />
        </svg>
      </div>

      {/* Low mist between the mountain and the near hills. */}
      <div className="mist absolute bottom-[4%] left-[10%] h-24 w-[80%]" />

      {/* Near hills: cherries in bloom, a pagoda, and a string of lanterns at night. */}
      <div className="depth absolute inset-x-0 bottom-0" style={depth(0.18, -2, -1)}>
        <div className="land-in relative" style={{ '--delay': '200ms' } as CSSProperties}>
          <svg
            className="absolute bottom-[calc(clamp(40px,7vh,64px)*0.36)] left-[8%] h-[clamp(58px,9vh,100px)] md:bottom-[calc(clamp(40px,7vh,64px)*0.64)] md:left-[43%] md:h-[clamp(64px,11vh,100px)]"
            viewBox="37 38 46 83"
          >
            <path className="ridge-near" d={PAGODA} />
          </svg>

          {/* Wider than a phone so the hills keep their proportions; the overflow is clipped. */}
          <svg
            className="block w-[max(100%,1100px)]"
            style={{ height: 'clamp(40px, 7vh, 64px)', overflow: 'visible' }}
            viewBox="0 0 1440 80"
            preserveAspectRatio="none"
          >
            <path d={TREES_BACK} fill="color-mix(in srgb, var(--color-sakura) 24%, var(--color-ridge-near))" />
            <path d={TREES_FRONT} fill="color-mix(in srgb, var(--color-sakura) 42%, var(--color-ridge-near))" />
            <path className="ridge-near" d={RIDGE_D} />
          </svg>

          <div className="lanterns absolute inset-x-[3%] bottom-[calc(clamp(40px,7vh,64px)*0.9)] h-10 md:inset-x-[4%] md:right-[62%]">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 40" preserveAspectRatio="none">
              <path
                d="M0 6 Q 50 30, 100 6"
                fill="none"
                stroke="color-mix(in srgb, var(--color-ink) 30%, transparent)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {Array.from({ length: LANTERN_COUNT }, (_, i) => {
              const t = (i + 0.5) / LANTERN_COUNT
              // Same quadratic as the string: y = 6 + 48t(1-t) in a 40-unit box.
              const y = ((6 + 48 * t * (1 - t)) / 40) * 100
              return (
                <span
                  key={i}
                  className="lantern absolute block h-[7px] w-[5px] -translate-x-1/2 rounded-[2px]"
                  style={{
                    left: `${t * 100}%`,
                    top: `${y}%`,
                    background: 'var(--color-lantern)',
                    boxShadow: '0 0 6px var(--color-lantern), 0 0 14px rgba(255,150,60,0.55)',
                    animationDelay: `${-i * 0.37}s`,
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
