'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={signOut}
      className="w-full py-3 text-sm font-semibold text-red-600 bg-white border border-red-200 rounded-2xl hover:bg-red-50 transition-colors"
    >
      Sign out
    </button>
  )
}
