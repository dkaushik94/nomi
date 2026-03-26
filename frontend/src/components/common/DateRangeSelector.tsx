import { Box, Button, Typography } from '@mui/material'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'

export type Preset = '7d' | '30d' | 'month' | 'custom'

const PRESETS: { key: Preset; label: string }[] = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'month', label: 'This month' },
  { key: 'custom', label: 'Custom' },
]

function presetDates(preset: Preset): { start: Dayjs; end: Dayjs } | null {
  const today = dayjs()
  if (preset === '7d') return { start: today.subtract(6, 'day'), end: today }
  if (preset === '30d') return { start: today.subtract(29, 'day'), end: today }
  if (preset === 'month') return { start: today.startOf('month'), end: today }
  return null
}

interface Props {
  startDate: string
  endDate: string
  defaultPreset?: Preset
  onChange: (start: string, end: string) => void
}

export default function DateRangeSelector({
  startDate,
  endDate,
  defaultPreset = 'month',
  onChange,
}: Props) {
  const [preset, setPreset] = useState<Preset>(defaultPreset)
  const [customStart, setCustomStart] = useState<Dayjs | null>(dayjs(startDate))
  const [customEnd, setCustomEnd] = useState<Dayjs | null>(dayjs(endDate))

  const selectPreset = (p: Preset) => {
    setPreset(p)
    if (p !== 'custom') {
      const d = presetDates(p)!
      onChange(d.start.format('YYYY-MM-DD'), d.end.format('YYYY-MM-DD'))
    }
  }

  const applyCustom = () => {
    if (customStart && customEnd && !customEnd.isBefore(customStart)) {
      onChange(customStart.format('YYYY-MM-DD'), customEnd.format('YYYY-MM-DD'))
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {/*
        Desktop (sm+): everything in one horizontal row — pills | pickers | apply
        Mobile (xs): pills stretch full-width; custom section stacks below with
                     pickers on one line and Apply spanning full width beneath them
      */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 1.5,
          width: { xs: '100%', sm: 'auto' },
        }}
      >
        {/* Preset pills */}
        <Box
          sx={{
            display: 'flex',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {PRESETS.map(({ key, label }) => (
            <Box
              key={key}
              onClick={() => selectPreset(key)}
              sx={{
                flex: { xs: 1, sm: 'none' },
                textAlign: 'center',
                px: { xs: 0, sm: 1.5 },
                py: 0.75,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                bgcolor: preset === key ? 'rgba(15,196,181,0.12)' : 'transparent',
                color: preset === key ? 'primary.main' : 'text.secondary',
                borderRight: key !== 'custom' ? '1px solid' : 'none',
                borderColor: 'divider',
                transition: 'background 0.15s, color 0.15s',
                userSelect: 'none',
                '&:hover': { bgcolor: 'rgba(15,196,181,0.07)', color: 'primary.main' },
              }}
            >
              {label}
            </Box>
          ))}
        </Box>

        {/* Custom date pickers */}
        {preset === 'custom' && (
          <Box
            sx={{
              display: 'flex',
              // Desktop: row — pickers + apply inline
              // Mobile: column — pickers on one row, apply full-width below
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: 1,
              width: { xs: '100%', sm: 'auto' },
              px: { xs: 1, sm: 0 },
            }}
          >
            {/* Pickers always in one horizontal row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DatePicker
                label="From"
                value={customStart}
                onChange={(v) => setCustomStart(v)}
                slotProps={{
                  textField: {
                    size: 'small',
                    // Fixed width on desktop; flex on mobile so they share the row equally
                    sx: { width: { xs: undefined, sm: 148 }, flex: { xs: 1, sm: 'none' } },
                  },
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>–</Typography>
              <DatePicker
                label="To"
                value={customEnd}
                minDate={customStart ?? undefined}
                onChange={(v) => setCustomEnd(v)}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: { width: { xs: undefined, sm: 148 }, flex: { xs: 1, sm: 'none' } },
                  },
                }}
              />
            </Box>

            {/* Apply — inline on desktop, full-width below on mobile */}
            <Button
              size="small"
              variant="contained"
              onClick={applyCustom}
              disabled={!customStart || !customEnd}
              sx={{
                textTransform: 'none',
                borderRadius: 1.5,
                fontWeight: 600,
                minWidth: { sm: 64 },
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              Apply
            </Button>
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  )
}
