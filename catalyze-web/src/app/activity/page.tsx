'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase, displayKind, type Detection } from '@/lib/supabase'
import { ConsistencyBadge } from '@/components/ConsistencyBadge'

const PAGE_SIZE = 20

function formatTime(ts: string) {
  return new Date(ts).toLocaleString('en-PH', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
    timeZone: 'Asia/Manila',
  })
}

type Row = Pick<Detection, 'id' | 'timestamp' | 'kind' | 'image_crop'>

type ConsistencyFilter = 'All' | 'Firm' | 'Soft' | 'Watery'

const dbKind: Record<ConsistencyFilter, string | null> = {
  All: null,
  Firm: 'Hard',
  Soft: 'Soft',
  Watery: 'Watery',
}

export default function ActivityPage() {
  const [filter, setFilter] = useState<ConsistencyFilter>('All')
  const [items, setItems] = useState<Row[]>([])
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const load = useCallback(async (f: ConsistencyFilter, off: number, replace: boolean) => {
    setLoading(true)
    let q = supabase
      .from('detections')
      .select('id, timestamp, kind, image_crop')
      .order('timestamp', { ascending: false })
      .range(off, off + PAGE_SIZE - 1)

    const kind = dbKind[f]
    if (kind) q = q.eq('kind', kind)

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

  const filters: ConsistencyFilter[] = ['All', 'Firm', 'Soft', 'Watery']

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">Activity Log</h1>

      {/* Consistency filter pills */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-brand-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
            }`}
          >
            {f}
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
            href={`/activity/${item.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
              {item.image_crop && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image_crop} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{displayKind(item.kind)}</p>
              <p className="text-xs text-gray-400">{formatTime(item.timestamp)}</p>
            </div>
            <ConsistencyBadge kind={item.kind} />
          </Link>
        ))}

        {loading && (
          <div className="p-6 text-center text-gray-400 text-sm">Loading…</div>
        )}
      </div>

      {hasMore && !loading && items.length > 0 && (
        <button
          onClick={loadMore}
          className="w-full py-3 text-sm text-brand-600 font-medium border border-brand-200 rounded-xl hover:bg-brand-50 transition-colors"
        >
          Load more
        </button>
      )}
    </div>
  )
}
