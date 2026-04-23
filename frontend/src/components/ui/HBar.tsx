import { fmt } from '@/lib/utils'

interface BarItem { label: string; amt: number; color: string }

interface Props { data: BarItem[] }

export function HBar({ data }: Props) {
  const max = Math.max(...data.map((d) => d.amt), 1)
  return (
    <div className="flex flex-col gap-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
              <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: d.color }} />
              <span className="text-[13px] text-ink font-medium truncate">{d.label}</span>
            </div>
            <span className="text-[13px] text-muted flex-shrink-0">{fmt(d.amt)}</span>
          </div>
          <div className="h-[5px] bg-card-b rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(d.amt / max) * 100}%`, background: d.color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
