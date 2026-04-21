import { useEffect, useState } from 'react'
import { CheckCircle2, Trash2 } from 'lucide-react'
import { getWaitlist, approveUser, purgeUser } from '@/services/api'
import { useToast } from '@/components/ui/useToast'
import { Spinner } from '@/components/ui/Spinner'
import type { WaitlistEntry } from '@/types'

export default function Admin() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const { show, node } = useToast()

  const load = async () => {
    setLoading(true)
    try { setEntries(await getWaitlist()) } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleApprove = async (id: string | number) => {
    try { await approveUser(id); show('User approved'); load() } catch (e) { show(e instanceof Error ? e.message : 'Failed') }
  }

  const handlePurge = async (id: string | number) => {
    try { await purgeUser(id); show('User purged'); load() } catch (e) { show(e instanceof Error ? e.message : 'Failed') }
  }

  return (
    <div className="px-4 md:px-8 py-5">
      <h1 className="font-display font-bold text-[22px] text-ink tracking-tight mb-6">Admin</h1>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : entries.length === 0 ? (
        <p className="text-muted text-[14px]">No waitlist entries</p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center gap-3 p-3.5 bg-card rounded-xl border border-brd">
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-ink">{e.email}</p>
                <p className="text-[12px] text-muted">{new Date(e.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => handleApprove(e.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-accent hover:bg-accent/10 transition-colors">
                <CheckCircle2 size={16} />
              </button>
              <button onClick={() => handlePurge(e.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red hover:bg-red/10 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      {node}
    </div>
  )
}
