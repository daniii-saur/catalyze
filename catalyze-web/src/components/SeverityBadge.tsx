import type { Severity } from '@/lib/supabase'

const styles: Record<string, string> = {
  normal:   'bg-green-100 text-green-800',
  warning:  'bg-yellow-100 text-yellow-800',
  critical: 'bg-red-100 text-red-800',
}

const labels: Record<string, string> = {
  normal:   'Normal',
  warning:  'Warning',
  critical: 'Critical',
}

export function SeverityBadge({ severity }: { severity: Severity | null }) {
  const s = severity ?? 'normal'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${styles[s]}`}>
      {labels[s]}
    </span>
  )
}
