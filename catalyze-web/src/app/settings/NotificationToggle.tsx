'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export function NotificationToggle({ userId, initialValue }: { userId: string; initialValue: boolean }) {
  const [enabled, setEnabled] = useState(initialValue)
  const [saving, setSaving] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const supabase = createClient()

  async function toggle(next: boolean) {
    if (!next && !showWarning) {
      setShowWarning(true)
      return
    }
    setSaving(true)
    setShowWarning(false)
    const { error } = await supabase
      .from('profiles')
      .update({ notify_email: next })
      .eq('id', userId)
    if (!error) setEnabled(next)
    setSaving(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800">Email alerts</p>
          <p className="text-xs text-gray-500 mt-0.5">Get notified for warning &amp; critical detections</p>
        </div>
        <button
          role="switch"
          aria-checked={enabled}
          disabled={saving}
          onClick={() => toggle(!enabled)}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 ${
            enabled ? 'bg-brand-500' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Confirmation warning when turning OFF */}
      {showWarning && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 space-y-3">
          <div className="flex gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5">
              <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-semibold text-red-800">Are you sure?</p>
          </div>
          <p className="text-sm text-red-700 leading-relaxed">
            If you turn off notifications, you may miss when a cat needs urgent attention. This can delay care for a sick animal.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => toggle(false)}
              className="flex-1 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Turn off anyway
            </button>
            <button
              onClick={() => setShowWarning(false)}
              className="flex-1 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Keep on
            </button>
          </div>
        </div>
      )}

      {enabled && (
        <p className="text-xs text-brand-600 flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
          </svg>
          Email alerts are active
        </p>
      )}
    </div>
  )
}
