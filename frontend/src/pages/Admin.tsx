import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Snackbar,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import { useCallback, useEffect, useState } from 'react'
import { approveUser, getWaitlist, purgeUser } from '@/services/api'
import type { WaitlistEntry } from '@/types'

export default function Admin() {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [snack, setSnack] = useState<string | null>(null)

  const loadWaitlist = useCallback(async () => {
    setLoading(true)
    try {
      setWaitlist(await getWaitlist())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadWaitlist() }, [loadWaitlist])

  const handleApprove = async (userId: number) => {
    try {
      await approveUser(userId)
      setSnack('User approved')
      loadWaitlist()
    } catch (err) {
      setSnack(err instanceof Error ? err.message : 'Failed to approve')
    }
  }

  const handlePurge = async (userId: number) => {
    if (!window.confirm('This will permanently delete all user data. Are you sure?')) return
    try {
      await purgeUser(userId)
      setSnack('User data purged')
      loadWaitlist()
    } catch (err) {
      setSnack(err instanceof Error ? err.message : 'Failed to purge')
    }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={1}>Admin</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Manage waitlisted users. You cannot view user financial data.
      </Typography>

      <Typography variant="subtitle1" fontWeight={600} mb={2}>
        Waitlist ({waitlist.length})
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}><CircularProgress /></Box>
      ) : waitlist.length === 0 ? (
        <Alert severity="info">No users on the waitlist.</Alert>
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          {waitlist.map((entry, i) => (
            <Box key={entry.id}>
              {i > 0 && <Divider />}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 2,
                  py: 1.5,
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={500}>{entry.email}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Requested {new Date(entry.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleApprove(entry.id)}
                    sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteForeverIcon />}
                    onClick={() => handlePurge(entry.id)}
                    sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}
                  >
                    Purge
                  </Button>
                </Box>
              </Box>
            </Box>
          ))}
        </Paper>
      )}

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} message={snack} />
    </Box>
  )
}
