import { useState } from 'react'
import dayjs from 'dayjs'
import { cn } from '@/lib/utils'

export type Preset = '7d' | '30d' | '3m' | 'custom'
export interface DateRange { start: string; end: string }

interface Props {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
}

function presetToRange(p: Preset): DateRange | null {
  const today = dayjs().format('YYYY-MM-DD')
  if (p === '7d')  return { start: dayjs().subtract(6,  'day').format('YYYY-MM-DD'), end: today }
  if (p === '30d') return { start: dayjs().subtract(29, 'day').format('YYYY-MM-DD'), end: today }
  if (p === '3m')  return { start: dayjs().subtract(3, 'month').add(1, 'day').format('YYYY-MM-DD'), end: today }
  return null
}

function detectPreset(v: DateRange): Preset {
  const today = dayjs().format('YYYY-MM-DD')
  if (v.end !== today) return 'custom'
  const diff = dayjs(v.end).diff(dayjs(v.start), 'day')
  if (diff === 6)  return '7d'
  if (diff === 29) return '30d'
  if (diff >= 88 && diff <= 92) return '3m'
  return 'custom'
}

const TABS: { id: Preset; label: string }[] = [
  { id: '7d',     label: '7D'     },
  { id: '30d',    label: '30D'    },
  { id: '3m',     label: '3M'     },
  { id: 'custom', label: 'Custom' },
]

export function DateRangeFilter({ value, onChange, className }: Props) {
  const [activePreset, setActivePreset] = useState<Preset>(() => detectPreset(value))

  const handleTab = (p: Preset) => {
    setActivePreset(p)
    if (p !== 'custom') {
      const r = presetToRange(p)
      if (r) onChange(r)
    }
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Preset tabs */}
      <div className="flex items-center bg-card border border-brd rounded-xl p-1 gap-0.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTab(t.id)}
            className={cn(
              'flex-1 py-2 rounded-lg text-[12px] md:text-[13px] font-semibold transition-colors whitespace-nowrap',
              activePreset === t.id
                ? 'bg-accent text-white shadow-sm'
                : 'text-muted hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Custom date inputs — only shown when custom is active */}
      {activePreset === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value.start}
            max={value.end}
            onChange={(e) => onChange({ ...value, start: e.target.value })}
            className="flex-1 min-w-0 bg-card border border-brd rounded-xl px-3 py-2 text-[13px] text-ink outline-none focus:border-accent transition-colors"
          />
          <span className="text-muted text-[11px] font-bold flex-shrink-0">→</span>
          <input
            type="date"
            value={value.end}
            min={value.start}
            max={dayjs().format('YYYY-MM-DD')}
            onChange={(e) => onChange({ ...value, end: e.target.value })}
            className="flex-1 min-w-0 bg-card border border-brd rounded-xl px-3 py-2 text-[13px] text-ink outline-none focus:border-accent transition-colors"
          />
        </div>
      )}
    </div>
  )
}
