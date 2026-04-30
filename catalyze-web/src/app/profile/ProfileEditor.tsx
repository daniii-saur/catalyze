'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export function ProfileEditor({
  userId,
  initialDisplayName,
  initialContactEmail,
  authEmail,
}: {
  userId: string
  initialDisplayName: string
  initialContactEmail: string
  authEmail: string
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [contactEmail, setContactEmail] = useState(initialContactEmail)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) {
      setError('Display name cannot be empty.')
      return
    }
    setSaving(true)
    setError(null)
    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        email: contactEmail.trim() || null,
      })
      .eq('id', userId)
    if (dbError) {
      setError(dbError.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          placeholder="Your name"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Contact Email for Alerts</label>
        <input
          type="email"
          value={contactEmail}
          onChange={e => setContactEmail(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          placeholder={authEmail}
        />
        {contactEmail && contactEmail !== authEmail && (
          <p className="text-xs text-gray-400 mt-1">
            Alert emails will go to this address instead of {authEmail}
          </p>
        )}
        {(!contactEmail || contactEmail === authEmail) && (
          <p className="text-xs text-gray-400 mt-1">Leave blank to use your sign-in email</p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
          saved
            ? 'bg-green-500 text-white'
            : 'bg-brand-500 text-white hover:bg-brand-600'
        }`}
      >
        {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save changes'}
      </button>
    </form>
  )
}
