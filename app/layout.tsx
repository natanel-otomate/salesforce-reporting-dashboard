import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'WorkPulse',
    template: '%s | WorkPulse',
  },
  description:
    'Cross-Workspace Reporting, Automated and Delivered. Aggregate live data from multiple Monday.com workspaces and deliver formatted executive reports on a configurable schedule.',
  keywords: ['monday.com', 'reporting', 'automation', 'workspace', 'analytics'],
  authors: [{ name: 'WorkPulse' }],
  creator: 'WorkPulse',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  ),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'WorkPulse',
    description: 'Cross-Workspace Reporting, Automated and Delivered.',
    siteName: 'WorkPulse',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WorkPulse',
    description: 'Cross-Workspace Reporting, Automated and Delivered.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`
          min-h-screen
          bg-gray-50
          text-gray-900
          font-sans
          antialiased
          ${inter.className}
        `}
      >
        <div className="relative flex min-h-screen flex-col">
          {children}
        </div>
      </body>
    </html>
  )
}