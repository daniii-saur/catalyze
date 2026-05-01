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
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [contactEmail, setContactEmail] = useState(initialContactEmail)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  function handleEdit() {
    setError(null)
    setEditing(true)
  }

  function handleCancel() {
    setDisplayName(initialDisplayName)
    setContactEmail(initialContactEmail)
    setError(null)
    setEditing(false)
  }

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
    setSaving(false)
    if (dbError) {
      setError(dbError.message)
    } else {
      setEditing(false)
      router.refresh()
    }
  }

  // ── Read-only view ────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-2.5 flex-1">
            <div>
              <p className="text-xs font-medium text-gray-400 mb-0.5">Display Name</p>
              <p className="text-sm font-medium text-gray-800">{displayName || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 mb-0.5">Alert Email</p>
              <p className="text-sm text-gray-800">
                {contactEmail && contactEmail !== authEmail
                  ? contactEmail
                  : <span className="text-gray-400">{authEmail} <span className="text-xs">(sign-in email)</span></span>
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleEdit}
            className="ml-4 px-3 py-1.5 text-xs font-semibold text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors flex-shrink-0"
          >
            Edit
          </button>
        </div>
      </div>
    )
  }

  // ── Edit mode ─────────────────────────────────────────────────────────
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
          autoFocus
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Alert Email</label>
        <input
          type="email"
          value={contactEmail}
          onChange={e => setContactEmail(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          placeholder={authEmail}
        />
        <p className="text-xs text-gray-400 mt-1">
          {contactEmail && contactEmail !== authEmail
            ? `Alert emails go to ${contactEmail}`
            : 'Leave blank to use your sign-in email'}
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
