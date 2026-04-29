import { displayKind } from '@/lib/supabase'

const styles: Record<string, string> = {
  Firm:    'bg-brand-100 text-brand-800',
  Soft:    'bg-amber-100 text-amber-800',
  Watery:  'bg-blue-100 text-blue-800',
  General: 'bg-gray-100 text-gray-600',
}

export function ConsistencyBadge({ kind }: { kind: string | null | undefined }) {
  const label = displayKind(kind)
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[label] ?? styles.General}`}>
      {label}
    </span>
  )
}
