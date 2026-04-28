import type { Metadata } from 'next'
import { Nav } from '@/components/Nav'
import './globals.css'

export const metadata: Metadata = {
  title: 'Catalyze — Cat Health Monitor',
  description: 'Automated litterbox detection dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
