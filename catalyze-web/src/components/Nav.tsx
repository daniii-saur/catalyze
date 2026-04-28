'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/',        label: 'Dashboard' },
  { href: '/history', label: 'History'   },
  { href: '/trends',  label: 'Trends'    },
]

export function Nav() {
  const path = usePathname()
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 flex items-center gap-1 h-14">
        <span className="font-semibold text-gray-800 mr-4">Catalyze</span>
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${path === l.href
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
