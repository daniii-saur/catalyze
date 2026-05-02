'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type MotorAction = 'cw' | 'ccw' | 'full_cycle'

const ACTION_LABELS: Record<MotorAction, string> = {
  cw: 'Rotate CW',
  ccw: 'Rotate CCW',
  full_cycle: 'Full Cycle Clean',
}

const ACTION_STYLES: Record<MotorAction, string> = {
  cw: 'bg-gradient-to-br from-sky-500 to-blue-700 shadow-[0_4px_16px_rgba(37,99,235,0.28)]',
  ccw: 'bg-gradient-to-br from-rose-500 to-red-700 shadow-[0_4px_16px_rgba(239,68,68,0.28)]',
  full_cycle: 'bg-gradient-to-br from-emerald-500 to-green-700 shadow-[0_4px_16px_rgba(16,185,129,0.28)]',
}

export function MotorActionButtons() {
  const router = useRouter()
  const [pending, setPending] = useState<MotorAction | null>(null)

  async function enqueue(action: MotorAction) {
    if (pending) return
    setPending(action)

    try {
      const res = await fetch('/api/motor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      router.refresh()
    } catch (err) {
      console.error(`[motor] enqueue ${action} failed`, err)
      setPending(null)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {(['cw', 'ccw', 'full_cycle'] as const).map((action) => {
        const isPending = pending === action
        const fullWidth = action === 'full_cycle'
        return (
          <button
            key={action}
            type="button"
            disabled={!!pending}
            onClick={() => enqueue(action)}
            className={`w-full py-3.5 rounded-2xl text-white font-semibold text-sm tracking-wide ${ACTION_STYLES[action]} ${fullWidth ? 'col-span-2' : ''} ${isPending ? 'opacity-75' : ''}`}
          >
            {isPending ? 'Sending…' : ACTION_LABELS[action]}
          </button>
        )
      })}
    </div>
  )
}