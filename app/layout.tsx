import type { Metadata } from 'next'
import './globals.css'
import { inter } from "./fonts"

export const metadata: Metadata = {
  title: 'TONIC | Your foundational piano',
  description: 'Your foundational piano.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
