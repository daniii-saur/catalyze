import type { Metadata, Viewport } from 'next'
import { BottomNav } from '@/components/BottomNav'
import './globals.css'

export const metadata: Metadata = {
  title: 'Catalyze — Cat Health Monitor',
  description: 'Automated litterbox detection dashboard',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#F97316',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="max-w-lg mx-auto px-4 pt-4 pb-24">{children}</main>
        <BottomNav />
      </body>
    </html>
  )
}
