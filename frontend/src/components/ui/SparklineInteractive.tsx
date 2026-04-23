import { useState } from 'react'
import dayjs from 'dayjs'
import { fmt } from '@/lib/utils'

const VB_W = 360

export interface SparkPoint { date: string; value: number }

interface Props {
  data: SparkPoint[]
  color?: string
  height?: number
}

// Build a smooth cubic bezier path through points.
// Uses horizontal control points (tension 0.35) for a natural, non-wiggly curve.
function smoothPath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]
    const curr = pts[i]
    const dx = curr.x - prev.x
    const tension = 0.35
    const cp1x = prev.x + dx * tension
    const cp2x = curr.x - dx * tension
    d += ` C ${cp1x} ${prev.y} ${cp2x} ${curr.y} ${curr.x} ${curr.y}`
  }
  return d
}

function smoothAreaPath(pts: Array<{ x: number; y: number }>, height: number): string {
  const line = smoothPath(pts)
  const last = pts[pts.length - 1]
  const first = pts[0]
  return `${line} L ${last.x} ${height} L ${first.x} ${height} Z`
}

export function SparklineInteractive({ data, color = 'var(--accent)', height = 80 }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  if (data.length < 2) return null

  const values = data.map((d) => d.value)
  const mn = Math.min(...values)
  const mx = Math.max(...values)
  const rng = mx - mn || 1
  const padY = height * 0.14

  const toY = (v: number) => height - padY - ((v - mn) / rng) * (height - padY * 2)
  const toX = (i: number) => (i / (data.length - 1)) * VB_W

  const pts = data.map((d, i) => ({ x: toX(i), y: toY(d.value) }))

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setHoverIdx(Math.round(pct * (data.length - 1)))
  }

  const hPct  = hoverIdx !== null ? hoverIdx / (data.length - 1) : null
  const hx    = hoverIdx !== null ? toX(hoverIdx) : null
  const hYPct = hoverIdx !== null ? toY(data[hoverIdx].value) / height : null
  const hPt   = hoverIdx !== null ? data[hoverIdx] : null

  const tooltipAlign =
    hPct == null ? 'center'
    : hPct > 0.72 ? 'right'
    : hPct < 0.28 ? 'left'
    : 'center'

  const tooltipTransform =
    tooltipAlign === 'right'  ? 'translateX(-100%)'
    : tooltipAlign === 'left' ? 'translateX(0)'
    : 'translateX(-50%)'

  return (
    <div className="relative w-full select-none" style={{ height }}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${VB_W} ${height}`}
        preserveAspectRatio="none"
        className="block"
        style={{ cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="sgi2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity=".18" />
            <stop offset="100%" stopColor={color} stopOpacity="0"   />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path
          d={smoothAreaPath(pts, height)}
          fill="url(#sgi2)"
        />

        {/* Line — vectorEffect keeps stroke visually 1.5px regardless of viewBox scaling */}
        <path
          d={smoothPath(pts)}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Hover crosshair */}
        {hx !== null && (
          <line
            x1={hx} y1={0} x2={hx} y2={height}
            stroke={color}
            strokeWidth="1"
            strokeDasharray="3 2"
            opacity="0.45"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {/* Dot — HTML div so it stays perfectly round regardless of SVG stretch */}
      {hPct !== null && hYPct !== null && (
        <div
          className="absolute w-[10px] h-[10px] rounded-full border-2 pointer-events-none z-10 transition-none"
          style={{
            left:        `${hPct  * 100}%`,
            top:         `${hYPct * 100}%`,
            transform:   'translate(-50%, -50%)',
            background:  color,
            borderColor: 'var(--bg)',
            boxShadow:   `0 0 6px ${color}60`,
          }}
        />
      )}

      {/* Tooltip */}
      {hPct !== null && hPt && (
        <div
          className="absolute bottom-[calc(100%+6px)] pointer-events-none z-20"
          style={{
            left:      `${hPct * 100}%`,
            transform: tooltipTransform,
          }}
        >
          <div className="bg-card border border-brd rounded-xl px-3 py-2 shadow-lg whitespace-nowrap">
            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.1em]">
              {dayjs(hPt.date).format('MMM D')}
            </p>
            <p className="font-display font-extrabold text-[16px] text-ink tracking-tight">
              {fmt(hPt.value)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
