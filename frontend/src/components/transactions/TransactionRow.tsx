import {
  Avatar,
  Box,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import type { Category, PlaidMapping, Transaction } from '@/types'

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

interface Props {
  transaction: Transaction
  categories: Category[]
  mappings: PlaidMapping[]
  onClick: () => void
}

export default function TransactionRow({ transaction, categories, mappings, onClick }: Props) {
  const plaidColor = transaction.plaid_category ? hashColor(transaction.plaid_category) : null

  // Resolve custom category: direct tag first, then plaid mapping fallback
  const customCat = transaction.custom_category_id
    ? categories.find((c) => c.id === transaction.custom_category_id)
    : (() => {
        if (!transaction.plaid_category) return undefined
        const mapping = mappings.find((m) => m.plaid_category === transaction.plaid_category)
        return mapping ? categories.find((c) => c.id === mapping.custom_category_id) : undefined
      })()
  const isAutoMapped = !transaction.custom_category_id && !!customCat

  return (
    <TableRow
      hover
      onClick={onClick}
      sx={{ cursor: 'pointer', '&:hover td': { bgcolor: 'rgba(255,255,255,0.015)' } }}
    >
      <TableCell sx={{ pl: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {transaction.logo_url ? (
            <Avatar src={transaction.logo_url} sx={{ width: 30, height: 30 }} />
          ) : (
            <Avatar sx={{ width: 30, height: 30, bgcolor: 'rgba(255,255,255,0.06)', fontSize: 12, color: 'text.secondary', fontWeight: 700 }}>
              {(transaction.merchant_name ?? transaction.name)[0]?.toUpperCase()}
            </Avatar>
          )}
          <Box>
            <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 220 }}>
              {transaction.merchant_name ?? transaction.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">{transaction.transaction_date}</Typography>
          </Box>
        </Box>
      </TableCell>

      <TableCell>
        {transaction.plaid_category && plaidColor && (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: 1.5, bgcolor: `${plaidColor}18`, border: `1px solid ${plaidColor}44`, maxWidth: 200 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: plaidColor, flexShrink: 0 }} />
            <Typography variant="caption" noWrap sx={{ fontSize: 11, fontWeight: 600, color: plaidColor, lineHeight: 1.2 }}>
              {transaction.plaid_category.replace(/_/g, ' ')}
            </Typography>
          </Box>
        )}
      </TableCell>

      <TableCell>
        {customCat ? (
          <Tooltip title={isAutoMapped ? 'Auto-mapped from Plaid category' : ''}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: 1.5, bgcolor: `${customCat.color}18`, border: `1px solid ${customCat.color}44` }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: customCat.color, flexShrink: 0 }} />
              <Typography variant="caption" noWrap sx={{ fontSize: 11, fontWeight: 600, color: customCat.color, lineHeight: 1.2 }}>
                {customCat.label}
              </Typography>
              {isAutoMapped && (
                <Typography variant="caption" sx={{ fontSize: 9, color: customCat.color, opacity: 0.7, ml: 0.25 }}>auto</Typography>
              )}
            </Box>
          </Tooltip>
        ) : (
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11 }}>—</Typography>
        )}
      </TableCell>

      <TableCell align="right" sx={{ pr: 2.5 }}>
        <Tooltip title={transaction.pending ? 'Pending' : ''}>
          <Typography
            variant="body2"
            fontWeight={600}
            color={transaction.amount > 0 ? 'error.main' : 'success.main'}
            sx={{ opacity: transaction.pending ? 0.6 : 1 }}
          >
            {transaction.amount > 0 ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
          </Typography>
        </Tooltip>
      </TableCell>
    </TableRow>
  )
}
