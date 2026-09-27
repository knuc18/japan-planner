import { useId, type CSSProperties } from 'react'
import { useInView } from '../lib/motion'

/**
 * A red seal, pressed onto the page once it scrolls into view. Square seals
 * knock the character out of solid ink (hakubun); round ones print it in red
 * inside a ring (shubun). A turbulence filter eats into the ink so it reads as
 * stamped rather than drawn.
 */
export default function Hanko({
  char,
  shape = 'square',
  caption,
  className = '',
  delay = 0,
  tilt = -6,
  active,
}: {
  char: string
  shape?: 'square' | 'round'
  caption?: string
  className?: string
  delay?: number
  tilt?: number
  /** Override the in-view trigger, e.g. to re-stamp when a verdict changes. */
  active?: boolean
}) {
  const [ref, inView] = useInView<HTMLSpanElement>('0px 0px -8% 0px')
  const down = active ?? inView
  const filter = `ink-${useId().replace(/:/g, '')}`
  const ringStyle: CSSProperties = { transformBox: 'fill-box', transformOrigin: 'center', opacity: 0 }

  return (
    <span
      ref={ref}
      className={`stamp ${down ? 'is-down' : ''} ${className}`}
      style={{ '--delay': `${delay}ms`, '--tilt': `${tilt}deg` } as CSSProperties}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" className="block h-full w-full overflow-visible">
        <defs>
          <filter id={filter} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="grain" />
            <feColorMatrix
              in="grain"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.4 0 0 0 1.95"
              result="speckle"
            />
            <feComposite in="SourceGraphic" in2="speckle" operator="in" result="inked" />
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="9" result="warp" />
            <feDisplacementMap in="inked" in2="warp" scale={shape === 'round' ? 2 : 3.5} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {shape === 'square' ? (
          <>
            <rect className="stamp-ring" x="4" y="4" width="92" height="92" rx="12" fill="none" stroke="var(--color-sun)" strokeWidth="3" style={ringStyle} />
            <g filter={`url(#${filter})`}>
              <rect x="4" y="4" width="92" height="92" rx="12" fill="var(--color-sun)" />
              <text
                x="50"
                y="52"
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="Shippori Mincho, serif"
                fontWeight="800"
                fontSize="64"
                fill="#fbf6ef"
              >
                {char}
              </text>
            </g>
          </>
        ) : (
          <>
            <circle className="stamp-ring" cx="50" cy="50" r="46" fill="none" stroke="var(--color-sun)" strokeWidth="3" style={ringStyle} />
            <g filter={`url(#${filter})`} fill="var(--color-sun)">
              <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-sun)" strokeWidth="5" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="var(--color-sun)" strokeWidth="1.5" />
              <text
                x="50"
                y={caption ? 45 : 52}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="Shippori Mincho, serif"
                fontWeight="800"
                fontSize={caption ? 44 : 52}
              >
                {char}
              </text>
              {caption && (
                <text
                  x="50"
                  y="74"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily="IBM Plex Mono, monospace"
                  fontWeight="600"
                  fontSize="10"
                  letterSpacing="1.2"
                >
                  {caption}
                </text>
              )}
            </g>
          </>
        )}
      </svg>
    </span>
  )
}
