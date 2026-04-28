import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Detection = {
  id: number
  local_id: number | null
  timestamp: string
  kind: string
  bbox_json: string | null
  red_pct: number | null
  yellow_pct: number | null
  green_pct: number | null
  brown_pct: number | null
  remark: string | null
  severity: 'normal' | 'warning' | 'critical' | null
  model_version: string | null
  image_full: string | null
  image_crop: string | null
  image_overlay: string | null
  created_at: string | null
}

export type Severity = 'normal' | 'warning' | 'critical'
