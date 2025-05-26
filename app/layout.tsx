import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'buyuk Ipak yoli',
  description: 'Buyuk Ipak yoli',
  generator: 'Next.js',
  applicationName: 'Buyuk Ipak yoli',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
