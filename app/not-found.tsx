import type { Metadata } from 'next'
import { NotFoundPage } from '@/components/errors/NotFoundPage'

export const metadata: Metadata = {
  title: 'Маршрут потерялся · Marshai',
  description: 'Страница не найдена. Спланируй поездку за 30 секунд.',
}

export default function NotFound() {
  return <NotFoundPage />
}
