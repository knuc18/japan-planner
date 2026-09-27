import type { CSSProperties, ReactNode } from 'react'
import { useInView } from '../lib/motion'

export default function Reveal({
  children,
  className = '',
  delay = 0,
  variant = 'up',
  style,
}: {
  children: ReactNode
  className?: string
  /** ms before this block starts moving, for hand-staggering siblings. */
  delay?: number
  variant?: 'up' | 'fade'
  style?: CSSProperties
}) {
  const [ref, visible] = useInView<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={`${variant === 'fade' ? 'reveal-fade' : 'reveal'} ${visible ? 'is-visible' : ''} ${className}`}
      style={delay ? ({ ...style, '--delay': `${delay}ms` } as CSSProperties) : style}
    >
      {children}
    </div>
  )
}
