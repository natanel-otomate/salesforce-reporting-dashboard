app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'BoardPulse — Every project. One view. Automatically.',
  description:
    'BoardPulse connects to your Monday.com account and renders a unified executive dashboard across all workspaces — updated automatically, no manual exports.',
  keywords: ['monday.com', 'project management', 'dashboard', 'reporting', 'boardpulse'],
  authors: [{ name: 'BoardPulse' }],
  openGraph: {
    title: 'BoardPulse',
    description: 'Every project. One view. Automatically.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full min-h-screen bg-gray-50 font-sans antialiased text-gray-900">
        <div className="flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}