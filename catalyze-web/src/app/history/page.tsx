'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase, type Detection, type Severity } from '@/lib/supabase'
import { SeverityBadge } from '@/components/SeverityBadge'

const PAGE_SIZE = 20

function formatTime(ts: string) {
  return new Date(ts).toLocaleString('en-PH', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
    timeZone: 'Asia/Manila',
  })
}

type Row = Pick<Detection, 'id' | 'timestamp' | 'severity' | 'remark' | 'image_crop'>

export default function HistoryPage() {
  const [filter, setFilter] = useState<Severity | null>(null)
  const [items, setItems] = useState<Row[]>([])
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const load = useCallback(async (sev: Severity | null, off: number, replace: boolean) => {
    setLoading(true)
    let q = supabase
      .from('detections')
      .select('id, timestamp, severity, remark, image_crop')
      .order('timestamp', { ascending: false })
      .range(off, off + PAGE_SIZE - 1)
    if (sev) q = q.eq('severity', sev)

    const { data } = await q
    const rows = (data ?? []) as Row[]
    setItems(prev => replace ? rows : [...prev, ...rows])
    setHasMore(rows.length === PAGE_SIZE)
    setLoading(false)
  }, [])

  useEffect(() => {
    setOffset(0)
    setHasMore(true)
    load(filter, 0, true)
  }, [filter, load])

  const loadMore = () => {
    const next = offset + PAGE_SIZE
    setOffset(next)
    load(filter, next, false)
  }

  const filters: { label: string; value: Severity | null }[] = [
    { label: 'All',      value: null       },
    { label: 'Normal',   value: 'normal'   },
    { label: 'Warning',  value: 'warning'  },
    { label: 'Critical', value: 'critical' },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">Detection History</h1>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={String(f.value)}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
              ${filter === f.value
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        {items.length === 0 && !loading && (
          <p className="p-8 text-center text-gray-400">No detections found</p>
        )}
        {items.map(item => (
          <Link
            key={item.id}
            href={`/history/${item.id}`}
            className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
              {item.image_crop && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image_crop} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500">{formatTime(item.timestamp)}</p>
              <p className="text-sm text-gray-800 truncate">{item.remark ?? '—'}</p>
            </div>
            <SeverityBadge severity={item.severity} />
          </Link>
        ))}

        {loading && (
          <div className="p-6 text-center text-gray-400 text-sm">Loading…</div>
        )}
      </div>

      {/* Load more */}
      {hasMore && !loading && items.length > 0 && (
        <button
          onClick={loadMore}
          className="w-full py-3 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Load more
        </button>
      )}
    </div>
  )
}
