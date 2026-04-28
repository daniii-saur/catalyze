const colors: Record<string, string> = {
  red:    'bg-red-400',
  yellow: 'bg-yellow-400',
  green:  'bg-green-400',
  brown:  'bg-amber-700',
}

export function ColorBar({ label, pct, color }: { label: string; pct: number | null; color: string }) {
  const value = pct ?? 0
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-14 text-gray-500 capitalize">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${colors[color] ?? 'bg-gray-400'}`}
          style={{ width: `${Math.min(value, 100).toFixed(1)}%` }}
        />
      </div>
      <span className="w-10 text-right text-gray-700 font-medium">{value.toFixed(1)}%</span>
    </div>
  )
}
