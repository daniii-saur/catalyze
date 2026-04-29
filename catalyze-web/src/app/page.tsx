import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { displayKind, type Detection } from '@/lib/supabase'
import { ConsistencyBadge } from '@/components/ConsistencyBadge'
import { SeverityBadge } from '@/components/SeverityBadge'

function formatTime(ts: string) {
  return new Date(ts).toLocaleString('en-PH', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
    timeZone: 'Asia/Manila',
  })
}

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const displayName = user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? 'there'

  const today = new Date().toISOString().slice(0, 10)
  const [{ count }, { data: recent }] = await Promise.all([
    supabase
      .from('detections')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', today),
    supabase
      .from('detections')
      .select('id, timestamp, kind, severity, remark, image_crop')
      .order('timestamp', { ascending: false })
      .limit(5),
  ])

  const todayCount = count ?? 0

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <section>
        <h1 className="text-xl font-bold text-gray-900">Welcome, {displayName}!</h1>
        <p className="text-sm text-gray-500 mt-0.5">Here&apos;s today&apos;s overview</p>
      </section>

      {/* Today event count circle */}
      <section className="flex justify-center">
        <div className="relative w-36 h-36 rounded-full bg-brand-50 border-4 border-brand-500 flex flex-col items-center justify-center">
          <span className="text-3xl">🐱</span>
          <span className="text-3xl font-bold text-brand-600">{todayCount}</span>
          <span className="text-xs text-gray-500">today&apos;s events</span>
        </div>
      </section>

      {/* Recent detections */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Recent</h2>
          <Link href="/activity" className="text-sm text-brand-600 font-medium hover:underline">See all →</Link>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          {(!recent || recent.length === 0) && (
            <p className="p-8 text-center text-gray-400 text-sm">No detections yet</p>
          )}
          {recent?.map(item => (
            <Link
              key={item.id}
              href={`/activity/${item.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                {item.image_crop && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_crop} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 font-medium">{displayKind(item.kind)}</p>
                <p className="text-xs text-gray-400">{formatTime(item.timestamp)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <ConsistencyBadge kind={item.kind} />
                {item.severity && item.severity !== 'normal' && (
                  <SeverityBadge severity={item.severity as Detection['severity']} />
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
