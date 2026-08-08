// Fixed values rather than Math.random so petals don't re-scatter on every
// re-render (the wizard re-renders the page on each keystroke of the slider).
const PETALS = [
  { left: 4, size: 13, fall: 15, sway: 4.5, delay: -2, tilt: 18 },
  { left: 11, size: 9, fall: 20, sway: 6, delay: -9, tilt: 55 },
  { left: 19, size: 15, fall: 13, sway: 3.8, delay: -5, tilt: 0 },
  { left: 26, size: 8, fall: 23, sway: 7, delay: -14, tilt: 70 },
  { left: 33, size: 12, fall: 17, sway: 5.2, delay: -1, tilt: 30 },
  { left: 41, size: 10, fall: 21, sway: 6.4, delay: -11, tilt: 42 },
  { left: 48, size: 14, fall: 14, sway: 4.2, delay: -7, tilt: 12 },
  { left: 56, size: 9, fall: 25, sway: 7.6, delay: -18, tilt: 63 },
  { left: 63, size: 13, fall: 16, sway: 5, delay: -3, tilt: 25 },
  { left: 70, size: 11, fall: 19, sway: 6.8, delay: -12, tilt: 48 },
  { left: 77, size: 8, fall: 24, sway: 8, delay: -6, tilt: 80 },
  { left: 84, size: 15, fall: 12, sway: 4, delay: -15, tilt: 5 },
  { left: 90, size: 10, fall: 22, sway: 5.6, delay: -4, tilt: 36 },
  { left: 96, size: 12, fall: 18, sway: 6.2, delay: -10, tilt: 58 },
]

/** Drifting sakura petals. Purely decorative — hidden under reduced motion. */
export default function Petals() {
  return (
    <div className="petal-field pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {PETALS.map((p, i) => (
        <div
          key={i}
          className="petal-drop"
          style={{
            left: `${p.left}%`,
            animationDuration: `${p.fall}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          <div
            className="petal-spin"
            style={{ animationDuration: `${p.sway}s`, animationDelay: `${p.delay}s` }}
          >
            <svg width={p.size} height={p.size} viewBox="0 0 12 12" style={{ transform: `rotate(${p.tilt}deg)` }}>
              {/* One petal: a rounded teardrop with the notched tip sakura have. */}
              <path
                d="M6 0.6 C 9.4 3, 11 6.2, 8.6 9.4 C 7.6 10.7, 6.6 11.2, 6 10.4 C 5.4 11.2, 4.4 10.7, 3.4 9.4 C 1 6.2, 2.6 3, 6 0.6 Z"
                className="fill-sakura"
                opacity="0.85"
              />
            </svg>
          </div>
        </div>
      ))}
    </div>
  )
}
