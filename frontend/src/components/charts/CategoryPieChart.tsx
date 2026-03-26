import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, type TooltipProps } from 'recharts'
import { Box, Paper, Typography } from '@mui/material'
import type { Transaction } from '@/types'
import { useMemo } from 'react'

const PLAID_PALETTE = [
  '#0fc4b5', '#c9a227', '#6366f1', '#ec4899', '#f97316',
  '#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#14b8a6',
  '#f59e0b', '#64748b', '#06b6d4', '#84cc16', '#e879f9',
]
function hashColor(label: string): string {
  let h = 0
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0
  return PLAID_PALETTE[h % PLAID_PALETTE.length]
}

interface ChartEntry {
  name: string
  value: number
  color: string
  pct: number
}

interface Props {
  transactions: Transaction[]
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as ChartEntry
  return (
    <Paper sx={{ px: 1.5, py: 1, bgcolor: '#0d1825', border: '1px solid rgba(15,196,181,0.2)' }}>
      <Typography variant="caption" color="text.secondary">{d.name}</Typography>
      <Typography variant="body2" fontWeight={700} sx={{ color: d.color }}>
        ${d.value.toFixed(2)} · {d.pct.toFixed(1)}%
      </Typography>
    </Paper>
  )
}

export default function CategoryPieChart({ transactions }: Props) {
  const data: ChartEntry[] = useMemo(() => {
    const totals = new Map<string, { total: number; color: string }>()

    for (const tx of transactions) {
      if (tx.pending || tx.amount <= 0) continue
      const label = tx.plaid_category?.replace(/_/g, ' ') ?? 'Other'
      const color = hashColor(label)

      const existing = totals.get(label)
      if (existing) {
        existing.total += tx.amount
      } else {
        totals.set(label, { total: tx.amount, color })
      }
    }

    const sorted = Array.from(totals.entries())
      .map(([name, { total, color }]) => ({ name, value: parseFloat(total.toFixed(2)), color, pct: 0 }))
      .sort((a, b) => b.value - a.value)

    const grandTotal = sorted.reduce((s, d) => s + d.value, 0)
    return sorted.map((d) => ({ ...d, pct: grandTotal > 0 ? (d.value / grandTotal) * 100 : 0 }))
  }, [transactions])

  if (!data.length) {
    return (
      <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary" variant="body2">No data</Typography>
      </Box>
    )
  }

  const totalSpend = data.reduce((s, d) => s + d.value, 0)
  const topItems = data.slice(0, 6)
  const rest = data.slice(6)
  const legendItems = rest.length > 0
    ? [...topItems, { name: 'Other', value: rest.reduce((s, d) => s + d.value, 0), color: '#334155', pct: rest.reduce((s, d) => s + d.pct, 0) }]
    : topItems

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" mb={2}>Spending by Plaid Category</Typography>

      <Box sx={{ position: 'relative', height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <Box sx={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center', pointerEvents: 'none',
        }}>
          <Typography variant="caption" color="text.secondary" display="block">Total</Typography>
          <Typography variant="body1" fontWeight={700} color="text.primary">
            ${totalSpend.toFixed(0)}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {legendItems.map((item) => (
          <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1, minWidth: 0 }}>
              {item.name}
            </Typography>
            <Box sx={{ width: 40, height: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.06)', overflow: 'hidden', flexShrink: 0 }}>
              <Box sx={{ height: '100%', width: `${item.pct}%`, bgcolor: item.color, borderRadius: 2 }} />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 34, textAlign: 'right', fontSize: 10.5 }}>
              {item.pct.toFixed(0)}%
            </Typography>
            <Typography variant="caption" fontWeight={600} color="text.primary" sx={{ minWidth: 52, textAlign: 'right', fontSize: 11 }}>
              ${item.value.toFixed(0)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
