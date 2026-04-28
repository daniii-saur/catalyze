'use client'

import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts'
import { supabase } from '@/lib/supabase'

type DayStats = {
  date: string
  avgRed: number
  count: number
  worstSeverity: 'normal' | 'warning' | 'critical'
}

function buildStats(rows: { timestamp: string; red_pct: number | null; severity: string | null }[]): DayStats[] {
  const map = new Map<string, { reds: number[]; severities: string[] }>()
  for (const r of rows) {
    const d = r.timestamp.slice(0, 10)
    if (!map.has(d)) map.set(d, { reds: [], severities: [] })
    map.get(d)!.reds.push(r.red_pct ?? 0)
    map.get(d)!.severities.push(r.severity ?? 'normal')
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { reds, severities }]) => ({
      date: date.slice(5),
      avgRed: parseFloat((reds.reduce((a, b) => a + b, 0) / reds.length).toFixed(1)),
      count: reds.length,
      worstSeverity: severities.includes('critical')
        ? 'critical'
        : severities.includes('warning')
        ? 'warning'
        : 'normal',
    }))
}

const severityColor: Record<string, string> = {
  normal:   '#22c55e',
  warning:  '#eab308',
  critical: '#ef4444',
}

export default function TrendsPage() {
  const [stats, setStats] = useState<DayStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const since = new Date(Date.now() - 14 * 86400_000).toISOString()
    supabase
      .from('detections')
      .select('timestamp, red_pct, severity')
      .gte('timestamp', since)
      .order('timestamp', { ascending: true })
      .then(({ data }) => {
        setStats(buildStats(data ?? []))
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <p className="text-gray-400 text-sm py-8 text-center">Loading trends…</p>
  }

  if (stats.length === 0) {
    return <p className="text-gray-400 text-sm py-8 text-center">No data in the last 14 days</p>
  }

  return (
    <div className="space-y-8">
      <h1 className="text-lg font-semibold text-gray-900">14-Day Trends</h1>

      {/* Red % line chart */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-1">Avg Red % per day</h2>
        <p className="text-xs text-gray-400 mb-4">High red % may indicate blood — watch if it stays above 15%</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={stats} margin={{ left: -20, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 'auto']} unit="%" />
            <Tooltip formatter={(v: number) => [`${v}%`, 'Avg red']} />
            <ReferenceLine
              y={15}
              stroke="#ef4444"
              strokeDasharray="4 2"
              label={{ value: '15%', fontSize: 11, fill: '#ef4444', position: 'insideTopRight' }}
            />
            <Line
              type="monotone"
              dataKey="avgRed"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* Event count bar chart */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Events per day</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats} margin={{ left: -20, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip formatter={(v: number) => [v, 'Events']} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {stats.map((entry, i) => (
                <Cell key={i} fill={severityColor[entry.worstSeverity]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-3 justify-center">
          {(['normal', 'warning', 'critical'] as const).map(s => (
            <span key={s} className="flex items-center gap-1.5 text-xs text-gray-500 capitalize">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: severityColor[s] }} />
              {s}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}
