import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts'
import { Box, Paper, Typography } from '@mui/material'
import { useMemo } from 'react'
import type { Transaction } from '@/types'

interface Props {
  transactions: Transaction[]
}

function getMonthLabel(date: Date) {
  return date.toLocaleString('default', { month: 'short', year: '2-digit' })
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <Paper sx={{ px: 1.5, py: 1, bgcolor: '#0d1825', border: '1px solid rgba(15,196,181,0.2)' }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={700} color="primary.main">
        ${payload[0].value?.toFixed(2)}
      </Typography>
    </Paper>
  )
}

export default function HistoricalBarChart({ transactions }: Props) {
  const data = useMemo(() => {
    const now = new Date()
    const months = Array.from({ length: 3 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (2 - i), 1)
      return {
        label: getMonthLabel(d),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        isCurrent: i === 2,
      }
    })

    const totals = new Map(months.map((m) => [m.key, 0]))
    for (const tx of transactions) {
      if (tx.pending || tx.amount <= 0) continue
      const k = tx.transaction_date.slice(0, 7)
      if (totals.has(k)) totals.set(k, (totals.get(k) ?? 0) + tx.amount)
    }

    return months.map((m) => ({
      month: m.label,
      total: parseFloat((totals.get(m.key) ?? 0).toFixed(2)),
      isCurrent: m.isCurrent,
    }))
  }, [transactions])

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" mb={2}>3-Month Overview</Typography>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barSize={52} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,196,181,0.08)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#6e9db0' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6e9db0' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(15,196,181,0.05)' }} />
          <Bar dataKey="total" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.isCurrent ? '#0fc4b5' : '#c9a227'}
                opacity={entry.isCurrent ? 1 : 0.6}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <Box sx={{ display: 'flex', gap: 2, mt: 1.5, justifyContent: 'flex-end' }}>
        {[{ color: '#c9a227', label: 'Previous months' }, { color: '#0fc4b5', label: 'Current month' }].map(({ color, label }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
            <Typography variant="caption" color="text.secondary">{label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
