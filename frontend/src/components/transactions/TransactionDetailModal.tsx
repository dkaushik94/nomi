import {
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogContent,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import type { Category, Transaction } from '@/types'

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

function DetailRow({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12, minWidth: 140 }}>
        {label}
      </Typography>
      <Box sx={{ textAlign: 'right', flex: 1 }}>
        {typeof value === 'string' ? (
          <Typography variant="body2" fontWeight={500} sx={{ color: accent ?? 'text.primary' }}>
            {value}
          </Typography>
        ) : value}
      </Box>
    </Box>
  )
}

interface Props {
  transaction: Transaction | null
  categories: Category[]
  onClose: () => void
}

export default function TransactionDetailModal({ transaction: tx, categories, onClose }: Props) {
  if (!tx) return null

  const customCat = categories.find((c) => c.id === tx.custom_category_id)
  const plaidColor = tx.plaid_category ? hashColor(tx.plaid_category) : '#64748b'
  const isDebit = tx.amount > 0

  return (
    <Dialog
      open={!!tx}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 } }}
    >
      {/* Header */}
      <Box sx={{ px: 3, pt: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {tx.logo_url ? (
              <Avatar src={tx.logo_url} sx={{ width: 48, height: 48 }} />
            ) : (
              <Avatar
                sx={{
                  width: 48, height: 48,
                  bgcolor: `${plaidColor}22`,
                  color: plaidColor,
                  fontWeight: 800,
                  fontSize: 18,
                  border: `1.5px solid ${plaidColor}44`,
                }}
              >
                {(tx.merchant_name ?? tx.name)[0]?.toUpperCase()}
              </Avatar>
            )}
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                {tx.merchant_name ?? tx.name}
              </Typography>
              {tx.merchant_name && tx.merchant_name !== tx.name && (
                <Typography variant="caption" color="text.secondary">{tx.name}</Typography>
              )}
            </Box>
          </Box>
          <Tooltip title="Close">
            <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Amount */}
        <Box sx={{ mt: 2.5, display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography
            variant="h3"
            fontWeight={800}
            sx={{ color: isDebit ? 'error.main' : 'success.main', lineHeight: 1 }}
          >
            {isDebit ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
          </Typography>
          <Typography variant="body2" color="text.secondary">{tx.currency_code}</Typography>
          {tx.pending && (
            <Chip
              label="Pending"
              size="small"
              sx={{ bgcolor: 'rgba(201,162,39,0.15)', color: 'secondary.main', fontWeight: 600, fontSize: 11 }}
            />
          )}
        </Box>
      </Box>

      <Divider />

      <DialogContent sx={{ px: 3, py: 2 }}>
        <Grid container spacing={0}>
          {/* Left column */}
          <Grid item xs={12}>
            <DetailRow label="Transaction date" value={tx.transaction_date} />
            {tx.authorized_date && tx.authorized_date !== tx.transaction_date && (
              <DetailRow label="Authorized date" value={tx.authorized_date} />
            )}
            <Divider sx={{ my: 0.5, opacity: 0.4 }} />

            <DetailRow
              label="Transaction Category"
              value={
                tx.plaid_category ? (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: 1.5, bgcolor: `${plaidColor}18`, border: `1px solid ${plaidColor}44` }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: plaidColor }} />
                    <Typography variant="caption" sx={{ fontSize: 11, fontWeight: 600, color: plaidColor }}>
                      {tx.plaid_category.replace(/_/g, ' ')}
                    </Typography>
                  </Box>
                ) : <Typography variant="body2" color="text.secondary">—</Typography>
              }
            />

            {tx.plaid_category_detailed && (
              <DetailRow
                label="Detailed category"
                value={
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', bgcolor: 'rgba(255,255,255,0.04)', px: 0.75, py: 0.25, borderRadius: 0.75 }}>
                    {tx.plaid_category_detailed.replace(/_/g, ' ')}
                  </Typography>
                }
              />
            )}

            {customCat && (
              <DetailRow
                label="Custom category"
                value={
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: customCat.color }} />
                    <Typography variant="body2" fontWeight={500} sx={{ color: customCat.color }}>
                      {customCat.label}
                    </Typography>
                  </Box>
                }
              />
            )}

            <Divider sx={{ my: 0.5, opacity: 0.4 }} />

            {tx.payment_channel && (
              <DetailRow label="Payment channel" value={tx.payment_channel.replace(/_/g, ' ')} />
            )}
            <DetailRow
              label="Account"
              value={
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', bgcolor: 'rgba(255,255,255,0.04)', px: 0.75, py: 0.25, borderRadius: 0.75 }}>
                  {tx.plaid_account_id.slice(-8).toUpperCase()}
                </Typography>
              }
            />
            <DetailRow
              label="Transaction ID"
              value={
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', bgcolor: 'rgba(255,255,255,0.04)', px: 0.75, py: 0.25, borderRadius: 0.75 }}>
                  {tx.plaid_transaction_id.slice(-12)}
                </Typography>
              }
            />
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  )
}
