const PETAL_ANGLES = [0, 72, 144, 216, 288]

function Blossom({ x, y, s, r, open = true }: { x: number; y: number; s: number; r: number; open?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      {open ? (
        <>
          {PETAL_ANGLES.map((a) => (
            <ellipse
              key={a}
              cx="0"
              cy="-4.6"
              rx="3"
              ry="4.2"
              transform={`rotate(${a})`}
              className="fill-sakura"
            />
          ))}
          <circle r="1.5" className="fill-sakura-deep" />
        </>
      ) : (
        // Unopened buds keep the branch from reading as a uniform pom-pom.
        <circle r="2.4" className="fill-sakura-deep" />
      )}
    </g>
  )
}

// Blossom placements are hand-set along the limbs — a scatter function put them
// in mid-air as often as on a branch.
const CLUSTER = [
  { x: 42, y: 26, s: 1.1, r: 12 },
  { x: 70, y: 16, s: 0.85, r: 60, open: false },
  { x: 96, y: 38, s: 1.25, r: 34 },
  { x: 128, y: 30, s: 0.9, r: 78 },
  { x: 150, y: 54, s: 1.15, r: 8 },
  { x: 176, y: 44, s: 0.8, r: 45, open: false },
  { x: 196, y: 68, s: 1.3, r: 22 },
  { x: 214, y: 92, s: 0.95, r: 65 },
  { x: 238, y: 74, s: 1.05, r: 15 },
  { x: 258, y: 104, s: 0.85, r: 50, open: false },
  { x: 118, y: 76, s: 1.0, r: 40 },
  { x: 86, y: 92, s: 0.9, r: 25 },
  { x: 58, y: 66, s: 1.15, r: 70 },
  { x: 276, y: 130, s: 1.1, r: 33 },
  { x: 168, y: 112, s: 0.8, r: 55, open: false },
]

export default function SakuraBranch({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 320 170"
      className="w-full h-auto branch-sway"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      aria-hidden
      focusable="false"
    >
      <g className="stroke-bark" fill="none" strokeLinecap="round">
        <path d="M -12 4 C 48 18, 104 20, 152 46 C 196 70, 232 82, 292 128" strokeWidth="6" />
        <path d="M 60 14 C 74 34, 78 58, 70 88" strokeWidth="3" />
        <path d="M 118 32 C 128 50, 126 66, 114 82" strokeWidth="2.5" />
        <path d="M 172 56 C 190 62, 204 76, 210 96" strokeWidth="2.5" />
        <path d="M 236 84 C 252 96, 264 114, 268 134" strokeWidth="2" />
        <path d="M 96 24 C 118 18, 140 22, 158 34" strokeWidth="2" />
      </g>
      {CLUSTER.map((b, i) => (
        <Blossom key={i} {...b} />
      ))}
    </svg>
  )
}
