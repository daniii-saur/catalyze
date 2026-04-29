import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { ColorWheelChart } from '@/components/ColorWheelChart'

function formatTime(ts: string) {
  return new Date(ts).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
    timeZone: 'Asia/Manila',
  })
}

function formatDateLabel(ts: string) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

const CONSISTENCY_COLORS: Record<string, string> = {
  Hard:   '#BCFD18',
  Soft:   '#67E15E',
  Watery: '#80FFDD',
}

const CONSISTENCY_LABELS: Record<string, string> = {
  Hard:   'Hard',
  Soft:   'Soft',
  Watery: 'Watery',
}

function ConsistencyBars({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const kinds = ['Hard', 'Soft', 'Watery']

  return (
    <div className="flex flex-col gap-[3px]">
      {kinds.map(k => {
        const pct = total > 0 ? Math.round((counts[k] ?? 0) / total * 100) : 0
        const barWidth = total > 0 ? Math.max((counts[k] ?? 0) / total * 100, 3) : 3
        return (
          <div key={k} className="flex items-center gap-1.5">
            <div
              className="rounded-sm"
              style={{
                width: `${barWidth * 1.13}px`,
                height: '11px',
                background: `linear-gradient(90deg, ${CONSISTENCY_COLORS[k]} 0%, #ffffff 100%)`,
                border: '1px solid #C1C1C1',
                minWidth: '4px',
                maxWidth: '113px',
              }}
            />
            <span className="text-[9px] text-[#404040] w-4 text-right">{counts[k] ?? 0}</span>
          </div>
        )
      })}
    </div>
  )
}

function ColorDots({ colors }: { colors: { brown: number; orange: number; green: number; red: number } }) {
  const sorted = [
    { color: '#7B3B00', value: colors.brown },
    { color: '#EE7B00', value: colors.orange },
    { color: '#5CB11A', value: colors.green },
    { color: '#B52E2E', value: colors.red },
  ].sort((a, b) => b.value - a.value)

  return (
    <div className="flex gap-[6px]">
      {sorted.map((d, i) => (
        <div
          key={i}
          className="rounded-full border border-white"
          style={{ width: 18, height: 18, backgroundColor: d.color }}
        />
      ))}
    </div>
  )
}

function ConsistencyTag({ kind }: { kind: string | null }) {
  const label = kind ? (CONSISTENCY_LABELS[kind] ?? kind) : 'Unknown'
  return (
    <span
      className="text-[10px] text-[#404040] px-[5px] py-[1px]"
      style={{ background: '#9BF5FF', borderRadius: 14, display: 'inline-block' }}
    >
      {label}
    </span>
  )
}

export default async function DashboardPage() {
  const supabase = createClient()

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const todayLabel = formatDateLabel(now.toISOString())

  const [{ count: todayCount, data: todayData }, { data: recent }] = await Promise.all([
    supabase
      .from('detections')
      .select('kind, red_pct, yellow_pct, green_pct, brown_pct', { count: 'exact' })
      .gte('timestamp', todayStr),
    supabase
      .from('detections')
      .select('id, timestamp, kind, image_crop, red_pct, yellow_pct, green_pct, brown_pct')
      .order('timestamp', { ascending: false })
      .limit(5),
  ])

  const cycles = todayCount ?? 0

  // Aggregate color percentages for today
  const colorAvg = { brown: 0, orange: 0, green: 0, red: 0 }
  if (todayData && todayData.length > 0) {
    const n = todayData.length
    for (const d of todayData) {
      colorAvg.brown  += (d.brown_pct  ?? 0) / n
      colorAvg.orange += (d.yellow_pct ?? 0) / n
      colorAvg.green  += (d.green_pct  ?? 0) / n
      colorAvg.red    += (d.red_pct    ?? 0) / n
    }
  }

  // Consistency counts for today
  const consistencyCounts: Record<string, number> = { Hard: 0, Soft: 0, Watery: 0 }
  if (todayData) {
    for (const d of todayData) {
      if (d.kind && d.kind in consistencyCounts) consistencyCounts[d.kind]++
    }
  }

  const hasUnusual = recent?.some(d => d.red_pct && d.red_pct > 20) ?? false

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex items-center gap-2 px-0.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Catalyze" className="w-[30px] h-[34px] object-contain" />
        <h1 className="text-base font-semibold text-[#404040]">Dashboard</h1>
      </header>

      {/* Daily Activity Overview Card */}
      <section
        className="bg-white w-full"
        style={{ borderRadius: 20, boxShadow: '0 4px 4px rgba(0,0,0,0.25)', padding: '16px' }}
      >
        {/* Card header row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-base font-semibold" style={{ color: '#34C759' }}>Today</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[#404040] font-medium">Daily Activity Overview</p>
            <p className="text-[11px] font-medium" style={{ color: '#34C759' }}>{todayLabel}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4">
          {/* Cleaning Cycles */}
          <div
            className="flex flex-col items-center justify-center flex-shrink-0"
            style={{ width: 78 }}
          >
            <span className="text-[42px] font-bold text-[#404040] leading-none">
              {String(cycles).padStart(2, '0')}
            </span>
            <span className="text-[10px] font-semibold mt-0.5" style={{ color: '#EE7B00' }}>
              Cleaning Cycles
            </span>
          </div>

          {/* Divider */}
          <div className="w-px bg-gray-200 self-stretch mx-1" />

          {/* Detected Colors */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <ColorWheelChart
              brown={Math.round(colorAvg.brown)}
              orange={Math.round(colorAvg.orange)}
              green={Math.round(colorAvg.green)}
              red={Math.round(colorAvg.red)}
            />
            <span className="text-[10px] font-semibold" style={{ color: '#EE7B00' }}>
              Detected Colors
            </span>
          </div>

          {/* Divider */}
          <div className="w-px bg-gray-200 self-stretch mx-1" />

          {/* Consistency */}
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-start gap-2">
              {/* Tag labels */}
              <div className="flex flex-col gap-[5px] flex-shrink-0">
                {['Hard', 'Soft', 'Watery'].map(k => (
                  <span
                    key={k}
                    className="text-[9px] text-[#404040] text-right"
                    style={{ minWidth: 32 }}
                  >
                    {k}
                  </span>
                ))}
              </div>
              <ConsistencyBars counts={consistencyCounts} />
            </div>
            <span className="text-[10px] font-semibold" style={{ color: '#EE7B00' }}>
              Consistency
            </span>
          </div>
        </div>

        {/* Status message */}
        <p className="text-right text-[11px] mt-3" style={{ color: '#8C8C8C' }}>
          {hasUnusual ? 'Unusual activity detected!' : 'No unusual activity!'}
        </p>
      </section>

      {/* Recent Detection */}
      <section>
        <h2 className="text-sm font-semibold text-[#404040] mb-2 px-0.5">Recent Detection:</h2>

        <div className="flex flex-col gap-[13px]">
          {(!recent || recent.length === 0) && (
            <div
              className="bg-white flex items-center justify-center py-8"
              style={{ borderRadius: 10, boxShadow: '0 4px 4px rgba(0,0,0,0.25)' }}
            >
              <p className="text-sm text-[#8C8C8C]">No detections yet</p>
            </div>
          )}

          {recent?.map(item => {
            const colors = {
              brown:  item.brown_pct  ?? 0,
              orange: item.yellow_pct ?? 0,
              green:  item.green_pct  ?? 0,
              red:    item.red_pct    ?? 0,
            }
            return (
              <Link
                key={item.id}
                href={`/activity/${item.id}`}
                className="bg-white flex items-center gap-3 px-4 py-[5px]"
                style={{
                  borderRadius: 10,
                  boxShadow: '0 4px 4px rgba(0,0,0,0.25)',
                  minHeight: 63,
                }}
              >
                {/* Cat image */}
                <div
                  className="flex-shrink-0 overflow-hidden bg-gray-100"
                  style={{ width: 53, height: 53, borderRadius: 6 }}
                >
                  {item.image_crop ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_crop} alt="" className="w-full h-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/cat-icon-overview.png" alt="" className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Data */}
                <div className="flex flex-col gap-[3px]">
                  <p className="text-[12px] font-semibold text-[#404040]">
                    {formatTime(item.timestamp)}
                  </p>
                  <ConsistencyTag kind={item.kind} />
                  <ColorDots colors={colors} />
                </div>
              </Link>
            )
          })}
        </div>

        {recent && recent.length > 0 && (
          <div className="mt-3 text-center">
            <Link href="/activity" className="text-sm text-[#E28331] font-medium">
              View all activity →
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
