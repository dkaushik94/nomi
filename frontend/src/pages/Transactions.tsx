import { Alert, Box, CircularProgress, Typography } from '@mui/material'
import { useCallback, useState } from 'react'
import dayjs from 'dayjs'
import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { usePlaidMappings } from '@/hooks/usePlaidMappings'
import { useNewTransactions } from '@/hooks/useNewTransactions'
import TransactionList from '@/components/transactions/TransactionList'
import DateRangeSelector from '@/components/common/DateRangeSelector'

function getDefaultDates() {
  const today = dayjs()
  return {
    start: today.startOf('month').format('YYYY-MM-DD'),
    end: today.format('YYYY-MM-DD'),
  }
}

export default function Transactions() {
  const defaults = getDefaultDates()
  const [startDate, setStartDate] = useState(defaults.start)
  const [endDate, setEndDate] = useState(defaults.end)

  const { transactions, loading, loadingMore, hasMore, error, loadMore, tagCategory, clearCategory } = useTransactions({
    startDate,
    endDate,
    paginated: true,
  })
  const { categories, create: createCategory } = useCategories()
  const { mappings } = usePlaidMappings()
  const { isNew, dismiss } = useNewTransactions()

  // Tag a transaction and mark it as reviewed (dismisses the "new" highlight)
  const handleTag = useCallback(async (txId: number, catId: number) => {
    await tagCategory(txId, catId)
    dismiss(txId)
  }, [tagCategory, dismiss])

  // Clear a transaction's category (doesn't dismiss the new highlight)
  const handleClear = useCallback(async (txId: number) => {
    await clearCategory(txId)
  }, [clearCategory])

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Transactions</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Browse and categorize your transactions.
          </Typography>
        </Box>
        <DateRangeSelector
          startDate={startDate}
          endDate={endDate}
          onChange={(s, e) => { setStartDate(s); setEndDate(e) }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TransactionList
          transactions={transactions}
          categories={categories}
          mappings={mappings}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
          isNew={isNew}
          onTag={handleTag}
          onClear={handleClear}
          onDismiss={dismiss}
          onCreate={createCategory}
        />
      )}
    </Box>
  )
}
