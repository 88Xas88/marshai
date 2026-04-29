import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Marshai — AI-планировщик путешествий',
  description:
    'Введи откуда, куда и когда — за 30 секунд получи готовый план поездки: реальные билеты, отели, маршрут по дням и карту.',
  keywords: [
    'AI-планировщик',
    'путешествия',
    'билеты',
    'отели',
    'маршрут',
    'планировщик поездок',
  ],
  openGraph: {
    title: 'Marshai — план поездки за 30 секунд',
    description:
      'Реальные цены билетов и отелей + AI-маршрут + карта по дням в одном плане.',
    locale: 'ru_RU',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#F2F2EF',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="min-h-dvh">{children}</body>
    </html>
  )
}
