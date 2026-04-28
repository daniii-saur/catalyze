import Link from 'next/link'
import { supabase, type Detection } from '@/lib/supabase'
import { SeverityBadge } from '@/components/SeverityBadge'
import { ColorBar } from '@/components/ColorBar'
import { DetectionImage } from '@/components/DetectionImage'

function formatTime(ts: string) {
  return new Date(ts).toLocaleString('en-PH', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

async function getLatest(): Promise<Detection | null> {
  const { data } = await supabase
    .from('detections')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()
  return data
}

async function getTodayEvents(): Promise<{ id: number; severity: string | null }[]> {
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('detections')
    .select('id, severity')
    .gte('timestamp', today)
  return (data ?? []) as { id: number; severity: string | null }[]
}

async function getRecent(): Promise<Pick<Detection, 'id' | 'timestamp' | 'severity' | 'remark' | 'image_crop'>[]> {
  const { data } = await supabase
    .from('detections')
    .select('id, timestamp, severity, remark, image_crop')
    .order('timestamp', { ascending: false })
    .limit(10)
  return data ?? []
}

export default async function DashboardPage() {
  const [latest, todayEvents, recent] = await Promise.all([
    getLatest(),
    getTodayEvents(),
    getRecent(),
  ])

  const counts = { normal: 0, warning: 0, critical: 0 }
  for (const e of todayEvents) {
    const s = e.severity
    if (s === 'normal' || s === 'warning' || s === 'critical') counts[s]++
  }

  return (
    <div className="space-y-6">
      {/* Latest detection */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Latest Detection</h2>
        {latest ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <SeverityBadge severity={latest.severity} />
                <p className="text-sm text-gray-500 mt-1">{formatTime(latest.timestamp)}</p>
              </div>
            </div>

            {latest.remark && (
              <p className="text-gray-800 font-medium">{latest.remark}</p>
            )}

            {/* Images */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Photo</p>
                <DetectionImage src={latest.image_crop} alt="crop" className="aspect-square w-full" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Color overlay</p>
                <DetectionImage src={latest.image_overlay} alt="overlay" className="aspect-square w-full" />
              </div>
            </div>

            {/* Color bars */}
            <div className="space-y-2 pt-1">
              <ColorBar label="Red"    pct={latest.red_pct}    color="red"    />
              <ColorBar label="Yellow" pct={latest.yellow_pct} color="yellow" />
              <ColorBar label="Green"  pct={latest.green_pct}  color="green"  />
              <ColorBar label="Brown"  pct={latest.brown_pct}  color="brown"  />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
            No detections yet
          </div>
        )}
      </section>

      {/* Today summary */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Today</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-2xl font-bold text-gray-900 mb-3">{todayEvents.length} events</p>
          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
              {counts.normal} normal
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
              {counts.warning} warning
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
              {counts.critical} critical
            </span>
          </div>
        </div>
      </section>

      {/* Recent list */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Recent</h2>
          <Link href="/history" className="text-sm text-blue-600 hover:underline">See all →</Link>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          {recent.length === 0 && (
            <p className="p-5 text-gray-400 text-sm">No history yet</p>
          )}
          {recent.map(item => (
            <Link
              key={item.id}
              href={`/history/${item.id}`}
              className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                {item.image_crop && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_crop} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 truncate">{formatTime(item.timestamp)}</p>
                <p className="text-sm text-gray-800 truncate">{item.remark ?? '—'}</p>
              </div>
              <SeverityBadge severity={item.severity} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
