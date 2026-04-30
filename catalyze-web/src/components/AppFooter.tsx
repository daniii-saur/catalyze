'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const hideOnRoutes = ['/login', '/signup', '/privacy', '/tos', '/policy', '/terms']

export function AppFooter() {
  const path = usePathname()
  if (hideOnRoutes.includes(path)) return null

  return (
    <footer className="mt-8 pb-2 text-center space-y-1.5">
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Link href="/about" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          About
        </Link>
        <span className="text-gray-300 text-xs">·</span>
        <Link href="/policy" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          Privacy Policy
        </Link>
        <span className="text-gray-300 text-xs">·</span>
        <Link href="/terms" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          Terms of Service
        </Link>
      </div>
      <p className="text-xs text-gray-300">Catalyze © 2026 · PSPCA Cat Health Monitor</p>
    </footer>
  )
}
