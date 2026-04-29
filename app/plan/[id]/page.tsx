import { notFound } from 'next/navigation'
import { PlanView } from '@/components/result/PlanView'
import { DEMO_PLAN } from '@/lib/demoPlan'
import { loadPlan as loadPlanFromDb, dbEnabled } from '@/lib/db'
import type { Plan } from '@/types/plan'

// План грузится по UUID на каждый запрос (динамический роут).
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function loadPlan(id: string): Promise<Plan | null> {
  // Демо-план — статичная фикстура, не лезем в БД.
  if (id === 'example-spb') return { ...DEMO_PLAN, id }

  // Реальный план: тянем из Neon, если БД настроена и id похож на UUID.
  if (dbEnabled && UUID_RE.test(id)) {
    const saved = await loadPlanFromDb(id)
    if (saved) return saved.plan
  }

  // Фолбэк: для preview-ID (`demo*`) и в dev-режиме показываем демо-план,
  // чтобы можно было ходить по UI без реальной БД.
  if (id.startsWith('demo') || process.env.NODE_ENV !== 'production') {
    return { ...DEMO_PLAN, id }
  }

  return null
}

export default async function PlanPage({ params }: PageProps) {
  const { id } = await params
  const plan = await loadPlan(id)
  if (!plan) notFound()
  return <PlanView plan={plan} />
}
