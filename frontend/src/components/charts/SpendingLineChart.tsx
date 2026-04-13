import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts'
import { Box, Paper, Typography } from '@mui/material'
import type { Transaction } from '@/types'
import { useMemo } from 'react'

interface Props {
  transactions: Transaction[]
  startDate?: string
  endDate?: string
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

export default function SpendingLineChart({ transactions, startDate, endDate }: Props) {
  const data = useMemo(() => {
    const byDay = new Map<string, number>()

    // Seed all days in the range with $0 so the x-axis covers the full selected period
    if (startDate && endDate) {
      const cursor = new Date(startDate + 'T00:00:00')
      const last = new Date(endDate + 'T00:00:00')
      while (cursor <= last) {
        byDay.set(cursor.toISOString().slice(0, 10), 0)
        cursor.setDate(cursor.getDate() + 1)
      }
    }

    for (const tx of transactions) {
      if (tx.pending || tx.amount <= 0) continue
      byDay.set(tx.transaction_date, (byDay.get(tx.transaction_date) ?? 0) + tx.amount)
    }

    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({
        date: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        total: parseFloat(total.toFixed(2)),
      }))
  }, [transactions, startDate, endDate])

  if (!data.length) {
    return (
      <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary" variant="body2">No spending data for this period</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" mb={2}>Daily Spending</Typography>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0fc4b5" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#0fc4b5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,196,181,0.08)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#6e9db0' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6e9db0' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(15,196,181,0.3)', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#0fc4b5"
            strokeWidth={2}
            fill="url(#spendGradient)"
            dot={false}
            activeDot={{ r: 5, fill: '#0fc4b5', stroke: '#070d14', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  )
}
