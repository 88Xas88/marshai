import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://marshai.ru'
).replace(/\/$/, '')

const TITLE = 'Marshai — AI-планировщик путешествий'
const DESCRIPTION =
  'Введи откуда, куда и когда — за 30 секунд получи готовый план поездки: реальные билеты, отели, маршрут по дням и карту.'
const SHORT_DESCRIPTION =
  'Реальные цены билетов и отелей + AI-маршрут + карта по дням в одном плане.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s · Marshai',
  },
  description: DESCRIPTION,
  applicationName: 'Marshai',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  keywords: [
    'AI-планировщик',
    'путешествия',
    'билеты',
    'отели',
    'маршрут',
    'планировщик поездок',
    'marshai',
    'маршай',
  ],
  authors: [{ name: 'Marshai' }],
  creator: 'Marshai',
  publisher: 'Marshai',
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'Marshai',
    title: 'Marshai — план поездки за 30 секунд',
    description: SHORT_DESCRIPTION,
    url: SITE_URL,
    locale: 'ru_RU',
    // OG-картинку Next автоматически возьмёт из app/opengraph-image.tsx (1200×630).
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marshai — план поездки за 30 секунд',
    description: SHORT_DESCRIPTION,
    // twitter:image — Next подставит ту же из app/opengraph-image.tsx.
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // ID веб-мастер-консолей: подставить когда домен подтвердится.
  verification: {
    // google: 'TODO_google_site_verification_code',
    // yandex: 'TODO_yandex_verification_code',
  },
  category: 'travel',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F2F2EF' },
    { media: '(prefers-color-scheme: dark)', color: '#2C2C2A' },
  ],
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
