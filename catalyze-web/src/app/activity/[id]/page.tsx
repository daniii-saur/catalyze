import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { displayKind } from '@/lib/supabase'
import { ConsistencyBadge } from '@/components/ConsistencyBadge'
import { ColorBar } from '@/components/ColorBar'
import { DetectionImage } from '@/components/DetectionImage'

export default async function DetectionDetailPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10)
  if (isNaN(id)) notFound()

  const supabase = createClient()
  const { data: d } = await supabase
    .from('detections')
    .select('*')
    .eq('id', id)
    .single()

  if (!d) notFound()

  const ts = new Date(d.timestamp).toLocaleString('en-PH', {
    weekday: 'short', month: 'short', day: 'numeric',
    year: 'numeric', hour: 'numeric', minute: '2-digit',
    timeZone: 'Asia/Manila',
  })

  const remark = `Detection recorded on ${new Date(d.timestamp).toLocaleDateString('en-PH', {
    month: 'long', day: 'numeric', year: 'numeric',
    timeZone: 'Asia/Manila',
  })}`

  return (
    <div className="space-y-5">
      <Link href="/activity" className="text-sm text-brand-600 font-medium hover:underline">← Back to Activity</Link>

      {/* Images */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-xs text-gray-400">Photo</p>
          <DetectionImage src={d.image_crop} alt="crop" className="aspect-square w-full" />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-gray-400">Color segmentation</p>
          <DetectionImage src={d.image_overlay} alt="overlay" className="aspect-square w-full" />
        </div>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <ConsistencyBadge kind={d.kind} />
        </div>
        <p className="text-gray-600 text-sm">{remark}</p>
        <p className="text-xs text-gray-400">{ts}</p>
      </div>

      {/* Color breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Color breakdown</h2>
        <ColorBar label="Red"    pct={d.red_pct}    color="red"    />
        <ColorBar label="Yellow" pct={d.yellow_pct} color="yellow" />
        <ColorBar label="Green"  pct={d.green_pct}  color="green"  />
        <ColorBar label="Brown"  pct={d.brown_pct}  color="brown"  />
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Info</h2>
        <dl className="text-sm space-y-1">
          <div className="flex gap-2">
            <dt className="text-gray-500 w-28">Detection ID</dt>
            <dd className="text-gray-800">#{d.id}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-gray-500 w-28">Consistency</dt>
            <dd className="text-gray-800">{displayKind(d.kind)}</dd>
          </div>
          {d.model_version && (
            <div className="flex gap-2">
              <dt className="text-gray-500 w-28">Model</dt>
              <dd className="text-gray-800">{d.model_version}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}
