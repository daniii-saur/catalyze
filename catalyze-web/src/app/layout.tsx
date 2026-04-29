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
  themeColor: '#8FD9FB',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <main className="max-w-lg mx-auto px-2.5 pt-5 pb-28 min-h-screen">{children}</main>
        <BottomNav />
      </body>
    </html>
  )
}
