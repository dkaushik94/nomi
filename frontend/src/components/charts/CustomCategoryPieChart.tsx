import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, type TooltipProps } from 'recharts'
import { Box, Paper, Typography } from '@mui/material'
import type { Category, PlaidMapping, Transaction } from '@/types'
import { useMemo } from 'react'

const UNCATEGORIZED_COLOR = '#334155'

interface ChartEntry {
  name: string
  value: number
  color: string
  pct: number
}

interface Props {
  transactions: Transaction[]
  categories: Category[]
  mappings: PlaidMapping[]
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

export default function CustomCategoryPieChart({ transactions, categories, mappings }: Props) {
  const data: ChartEntry[] = useMemo(() => {
    const catMap = new Map(categories.map((c) => [c.id, c]))
    const mappingMap = new Map(mappings.map((m) => [m.plaid_category, m.custom_category_id]))
    const totals = new Map<string, { total: number; color: string }>()

    for (const tx of transactions) {
      if (tx.pending || tx.amount <= 0) continue

      // Resolve category: direct tag → plaid mapping → uncategorized
      let label = 'Uncategorized'
      let color = UNCATEGORIZED_COLOR

      if (tx.custom_category_id) {
        const cat = catMap.get(tx.custom_category_id)
        if (cat) { label = cat.label; color = cat.color }
      } else if (tx.plaid_category) {
        const mappedId = mappingMap.get(tx.plaid_category)
        if (mappedId) {
          const cat = catMap.get(mappedId)
          if (cat) { label = cat.label; color = cat.color }
        }
      }

      const existing = totals.get(label)
      if (existing) {
        existing.total += tx.amount
      } else {
        totals.set(label, { total: tx.amount, color })
      }
    }

    const sorted = Array.from(totals.entries())
      .map(([name, { total, color }]) => ({ name, value: parseFloat(total.toFixed(2)), color, pct: 0 }))
      .sort((a, b) => {
        // Uncategorized always last
        if (a.name === 'Uncategorized') return 1
        if (b.name === 'Uncategorized') return -1
        return b.value - a.value
      })

    const grandTotal = sorted.reduce((s, d) => s + d.value, 0)
    return sorted.map((d) => ({ ...d, pct: grandTotal > 0 ? (d.value / grandTotal) * 100 : 0 }))
  }, [transactions, categories, mappings])

  if (!data.length) {
    return (
      <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary" variant="body2">No data</Typography>
      </Box>
    )
  }

  const totalSpend = data.reduce((s, d) => s + d.value, 0)
  const topItems = data.slice(0, 7)
  const rest = data.slice(7)
  const legendItems = rest.length > 0
    ? [...topItems, { name: 'Other', value: rest.reduce((s, d) => s + d.value, 0), color: '#475569', pct: rest.reduce((s, d) => s + d.pct, 0) }]
    : topItems

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" mb={2}>Spending by Custom Category</Typography>

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
