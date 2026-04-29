import type { Metadata } from 'next'
import { PlanView } from '@/components/result/PlanView'
import { DEMO_PLAN } from '@/lib/demoPlan'

export const metadata: Metadata = {
  title: 'Москва → Санкт-Петербург · 5 дней | Marshai',
  description:
    'Готовый план поездки на 5 дней: Сапсан, апартаменты в центре, маршрут по дням и карта.',
}

export default function ExamplePlanPage() {
  return <PlanView plan={DEMO_PLAN} />
}
