import { useLayoutEffect, useRef, useState } from 'react'
import type { RouteStop } from '../lib/itinerary'
import { REGION_META } from '../data/regions'

const VIEW_H = 460
const PAD = 42

// Don't zoom past this, or a Tokyo-Hakone hop fills the chart at street scale.
const MIN_SPAN_LAT = 1.4
const MIN_SPAN_LNG = 1.6

function niceStep(span: number) {
  if (span > 12) return 5
  if (span > 6) return 2
  if (span > 2.5) return 1
  return 0.5
}

function ticks(min: number, max: number) {
  const step = niceStep(max - min)
  const out: number[] = []
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) out.push(Number(v.toFixed(1)))
  return out
}

// ponytail: a route chart, not a map. An earlier version drew a hand-authored
// coastline that was inaccurate enough to be misleading, so stops now sit at
// true projected coordinates against a graticule. The projection fits the
// selected route rather than all of Japan, otherwise short trips collapse into
// one corner. Swap in real GeoJSON if a literal landmass is ever wanted.
export default function JapanMap({ stops }: { stops: RouteStop[] }) {
  // Measure the rendered width so nodes and labels stay a consistent physical
  // size whatever the viewBox works out to and however wide the column is.
  const wrapRef = useRef<HTMLDivElement>(null)
  const [renderW, setRenderW] = useState(560)
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setRenderW(entry.contentRect.width || 560))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const lats = stops.map((s) => s.region.lat)
  const lngs = stops.map((s) => s.region.lng)

  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2
  const midLng = (Math.min(...lngs) + Math.max(...lngs)) / 2
  const spanLat = Math.max(Math.max(...lats) - Math.min(...lats), MIN_SPAN_LAT) * 1.18
  const spanLng = Math.max(Math.max(...lngs) - Math.min(...lngs), MIN_SPAN_LNG) * 1.18

  const latMin = midLat - spanLat / 2
  const latMax = midLat + spanLat / 2
  const lngMin = midLng - spanLng / 2
  const lngMax = midLng + spanLng / 2

  // Size the frame to the route's true shape (a degree of longitude shrinks by
  // cos(latitude)) so the chart is never mostly empty and never stretched.
  const aspect = (spanLng * Math.cos((midLat * Math.PI) / 180)) / spanLat
  const VIEW_W = Math.round(Math.min(760, Math.max(300, (VIEW_H - PAD * 2) * aspect + PAD * 2)))

  // viewBox units per rendered pixel — multiply any glyph size by this and it
  // lands at that many CSS pixels on screen.
  const k = VIEW_W / Math.max(240, renderW)
  const targetR = Math.min(14, Math.max(9, renderW / 44))
  const nodeR = targetR * k
  const codeSize = targetR * 0.73 * k
  const tickSize = 8 * k

  const px = (lng: number) => PAD + ((lng - lngMin) / (lngMax - lngMin)) * (VIEW_W - PAD * 2)
  const py = (lat: number) => VIEW_H - PAD - ((lat - latMin) / (latMax - latMin)) * (VIEW_H - PAD * 2)

  // Kyoto, Osaka and Nara are genuinely near-coincident at this scale. Nudge
  // overlapping nodes apart so every stop stays readable.
  const pts = stops.map((s) => ({ x: px(s.region.lng), y: py(s.region.lat) }))
  const minGap = nodeR * 2 + 3 * k
  for (let iter = 0; iter < 80; iter++) {
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[j].x - pts[i].x
        const dy = pts[j].y - pts[i].y
        const d = Math.hypot(dx, dy) || 0.01
        if (d >= minGap) continue
        const push = (minGap - d) / 2
        const ux = (dx / d) * push
        const uy = (dy / d) * push
        pts[i].x -= ux
        pts[i].y -= uy
        pts[j].x += ux
        pts[j].y += uy
      }
    }
  }
  for (const p of pts) {
    p.x = Math.min(VIEW_W - PAD / 2, Math.max(PAD / 2, p.x))
    p.y = Math.min(VIEW_H - PAD / 2, Math.max(PAD / 2, p.y))
  }

  const routeD = pts.length > 1 ? `M ${pts.map((p) => `${p.x},${p.y}`).join(' L ')}` : ''
  const routeKey = stops.map((s) => s.region.id).join('-')

  return (
    <div ref={wrapRef} className="w-full">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto max-h-[26rem]"
        role="img"
        aria-label={`Route chart: ${stops.map((s) => s.region.name).join(' to ')}`}
      >
      <g className="stroke-current text-ink/[0.1]" strokeWidth={0.5 * k}>
        {ticks(latMin, latMax).map((lat) => (
          <line key={`la${lat}`} x1={PAD / 2} y1={py(lat)} x2={VIEW_W - PAD / 2} y2={py(lat)} />
        ))}
        {ticks(lngMin, lngMax).map((lng) => (
          <line key={`ln${lng}`} x1={px(lng)} y1={PAD / 2} x2={px(lng)} y2={VIEW_H - PAD / 2} />
        ))}
      </g>
      <g className="tnum fill-current text-ink/30" fontSize={tickSize}>
        {ticks(latMin, latMax).map((lat) => (
          <text key={`la${lat}`} x={PAD / 2 + 3} y={py(lat) - 4 * k}>
            {lat}°N
          </text>
        ))}
        {ticks(lngMin, lngMax).map((lng) => (
          <text key={`ln${lng}`} x={px(lng) + 3} y={VIEW_H - PAD / 2 - 4 * k}>
            {lng}°E
          </text>
        ))}
      </g>

      {pts.slice(0, -1).map((p, i) => {
        const q = pts[i + 1]
        const length = Math.hypot(q.x - p.x, q.y - p.y)
        return (
          <line
            key={`${routeKey}-${i}`}
            x1={p.x}
            y1={p.y}
            x2={q.x}
            y2={q.y}
            stroke={REGION_META[stops[i + 1].region.id].color}
            strokeWidth={3 * k}
            strokeLinecap="round"
            className="line-ink"
            strokeDasharray={length}
            strokeDashoffset={length}
            style={{ animation: `draw 0.55s ease forwards ${i * 190}ms` }}
          />
        )
      })}

      {stops.map((s, i) => {
        const meta = REGION_META[s.region.id]
        const p = pts[i]
        return (
          <g key={s.region.id} style={{ animation: `rise 0.45s ease backwards ${i * 190 + 220}ms` }}>
            <circle cx={p.x} cy={p.y} r={nodeR} fill={meta.color} />
            <circle cx={p.x} cy={p.y} r={nodeR} fill="none" stroke="var(--color-paper)" strokeWidth={2 * k} />
            <text
              x={p.x}
              y={p.y + 3.4 * k}
              textAnchor="middle"
              className="tnum"
              fontSize={codeSize}
              fontWeight="600"
              fill="#fff"
            >
              {meta.code}
            </text>
          </g>
        )
      })}

      {routeD && (
        <circle r={3.5 * k} fill="var(--color-ink)">
          <animateMotion dur={`${Math.max(5, stops.length * 1.4)}s`} repeatCount="indefinite" path={routeD} />
        </circle>
      )}
      </svg>
    </div>
  )
}
