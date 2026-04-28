import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { SeverityBadge } from '@/components/SeverityBadge'
import { ColorBar } from '@/components/ColorBar'
import { DetectionImage } from '@/components/DetectionImage'

export default async function DetectionDetailPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10)
  if (isNaN(id)) notFound()

  const { data } = await supabase
    .from('detections')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) notFound()

  const d = data
  const ts = new Date(d.timestamp).toLocaleString('en-PH', {
    weekday: 'short', month: 'short', day: 'numeric',
    year: 'numeric', hour: 'numeric', minute: '2-digit',
    timeZone: 'Asia/Manila',
  })

  return (
    <div className="space-y-5">
      <Link href="/history" className="text-sm text-blue-600 hover:underline">← Back to History</Link>

      {/* Images */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-xs text-gray-400">Photo</p>
          <DetectionImage src={d.image_crop} alt="crop" className="aspect-square w-full" />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-gray-400">Color overlay</p>
          <DetectionImage src={d.image_overlay} alt="overlay" className="aspect-square w-full" />
        </div>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-2">
        <SeverityBadge severity={d.severity} />
        <p className="text-gray-800 font-medium text-base">{d.remark ?? 'No remark'}</p>
        <p className="text-sm text-gray-500">{ts}</p>
      </div>

      {/* Color breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Color breakdown</h2>
        <ColorBar label="Red"    pct={d.red_pct}    color="red"    />
        <ColorBar label="Yellow" pct={d.yellow_pct} color="yellow" />
        <ColorBar label="Green"  pct={d.green_pct}  color="green"  />
        <ColorBar label="Brown"  pct={d.brown_pct}  color="brown"  />
      </div>

      {/* Meta */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Info</h2>
        <dl className="text-sm space-y-1">
          <div className="flex gap-2">
            <dt className="text-gray-500 w-28">Detection ID</dt>
            <dd className="text-gray-800">#{d.id}</dd>
          </div>
          {d.model_version && (
            <div className="flex gap-2">
              <dt className="text-gray-500 w-28">Model</dt>
              <dd className="text-gray-800">{d.model_version}</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="text-gray-500 w-28">Kind</dt>
            <dd className="text-gray-800 capitalize">{d.kind}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
