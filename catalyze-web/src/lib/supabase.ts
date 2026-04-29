/**
 * Shared Supabase client + types.
 * - In Server Components / Route Handlers: import from './supabase-server'
 * - In Client Components: import from './supabase-browser'
 * This file keeps the `supabase` export for any legacy import sites.
 */
import { createClient } from './supabase-browser'
export const supabase = createClient()

// ── Types ────────────────────────────────────────────────────────────────────

export type Severity = 'normal' | 'warning' | 'critical'

/** Map the database `kind` value to a user-facing consistency label. */
export function displayKind(kind: string | null | undefined): string {
  switch (kind) {
    case 'Hard':   return 'Firm'
    case 'Soft':   return 'Soft'
    case 'Watery': return 'Watery'
    default:       return 'General'
  }
}

export interface Detection {
  id: number
  local_id: number | null
  timestamp: string
  kind: string | null
  bbox_json: string | null
  red_pct: number | null
  yellow_pct: number | null
  green_pct: number | null
  brown_pct: number | null
  remark: string | null
  severity: Severity | null
  model_version: string | null
  image_cat: string | null
  image_poop: string | null
  image_full: string | null
  image_crop: string | null
  image_overlay: string | null
  created_at: string | null
}

export interface Profile {
  id: string
  display_name: string | null
  email: string | null
  notify_email: boolean
  created_at: string | null
}
