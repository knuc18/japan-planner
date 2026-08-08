import type { RouteStop } from '../lib/itinerary'

const VIEW_W = 400
const VIEW_H = 560

// Bounding box for the projection — roughly Kyushu to northern Hokkaido.
const LNG_MIN = 129.5
const LNG_MAX = 145.8
const LAT_MIN = 31
const LAT_MAX = 45.5

function project(lat: number, lng: number): [number, number] {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * VIEW_W
  const y = VIEW_H - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * VIEW_H
  return [x, y]
}

// ponytail: a hand-drawn silhouette, not a real coastline — plenty for an
// evocative route map at this scale, swap for real GeoJSON if precision ever matters.
const ISLAND_PATH =
  'M 230 40 C 260 55, 270 90, 250 120 C 275 140, 280 175, 255 200 C 270 225, 260 260, 230 275 ' +
  'C 245 300, 235 330, 205 345 C 215 370, 200 400, 175 410 C 185 435, 165 460, 140 465 ' +
  'C 150 485, 130 505, 105 500 C 90 490, 95 465, 115 455 C 100 440, 110 415, 135 410 ' +
  'C 120 390, 135 365, 160 360 C 145 340, 160 310, 190 300 C 175 275, 190 245, 220 235 ' +
  'C 200 210, 210 175, 240 165 C 220 140, 225 105, 250 90 C 235 70, 230 55, 230 40 Z'

const KYUSHU_PATH = 'M 60 470 C 80 460, 100 475, 95 495 C 105 510, 90 530, 65 525 C 45 520, 40 495, 60 470 Z'
const HOKKAIDO_PATH = 'M 270 20 C 300 10, 330 30, 320 55 C 335 75, 315 95, 290 85 C 270 90, 255 65, 265 45 C 255 35, 260 25, 270 20 Z'

export default function JapanMap({ stops }: { stops: RouteStop[] }) {
  const points = stops.map((s) => project(s.region.lat, s.region.lng))
  const pathD = points.length > 1 ? `M ${points.map((p) => p.join(',')).join(' L ')}` : ''

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-full" role="img" aria-label="Route map of Japan">
      <path d={ISLAND_PATH} fill="currentColor" className="text-sumi/[0.06]" />
      <path d={KYUSHU_PATH} fill="currentColor" className="text-sumi/[0.06]" />
      <path d={HOKKAIDO_PATH} fill="currentColor" className="text-sumi/[0.06]" />

      {pathD && (
        <path
          key={stops.map((s) => s.region.id).join('-')}
          d={pathD}
          fill="none"
          stroke="var(--color-vermilion)"
          strokeWidth={2}
          strokeDasharray={8}
          strokeLinecap="round"
          pathLength={1000}
          style={{
            animation: 'dash 2.4s ease forwards',
            strokeDashoffset: 1000,
          }}
        />
      )}

      {stops.map((s, i) => {
        const [x, y] = project(s.region.lat, s.region.lng)
        return (
          <g key={s.region.id} transform={`translate(${x}, ${y})`}>
            <circle r={6} fill="var(--color-vermilion)" stroke="var(--color-washi)" strokeWidth={2} />
            <text x={10} y={4} className="font-display fill-current text-sumi text-[13px]">
              {i + 1}. {s.region.name}
            </text>
          </g>
        )
      })}

      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  )
}
