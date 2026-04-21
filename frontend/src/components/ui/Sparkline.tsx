interface Props {
  data: number[]
  color: string
  height?: number
  width?: number
}

export function Sparkline({ data, color, height = 44, width = 320 }: Props) {
  if (data.length < 2) return null
  const mn = Math.min(...data)
  const mx = Math.max(...data)
  const rng = mx - mn || 1
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - mn) / rng) * (height * 0.76) - height * 0.1}`)
    .join(' ')
  const [lx, ly] = pts.split(' ').slice(-1)[0].split(',')

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`M ${pts.split(' ').join(' L ')} L ${width},${height} L 0,${height} Z`}
        fill="url(#sg)"
      />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lx} cy={ly} r="3.5" fill={color} />
    </svg>
  )
}
