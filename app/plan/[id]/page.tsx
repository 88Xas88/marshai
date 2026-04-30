import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PlanView } from '@/components/result/PlanView'
import { DEMO_PLAN } from '@/lib/demoPlan'
import { loadPlan as loadPlanFromDb, dbEnabled } from '@/lib/db'
import { buildPlanMeta } from '@/lib/planMeta'
import type { Plan } from '@/types/plan'

// План грузится по UUID на каждый запрос (динамический роут).
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// React `cache` дедуплицирует вызов в рамках одного запроса:
// generateMetadata + page оба вызывают loadPlan, без cache был бы 2× SQL.
const loadPlan = cache(async (id: string): Promise<Plan | null> => {
  if (id === 'example-spb') return { ...DEMO_PLAN, id }

  if (dbEnabled && UUID_RE.test(id)) {
    const saved = await loadPlanFromDb(id)
    if (saved) return saved.plan
  }

  if (id.startsWith('demo') || process.env.NODE_ENV !== 'production') {
    return { ...DEMO_PLAN, id }
  }

  return null
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const plan = await loadPlan(id)
  if (!plan) {
    return {
      title: 'План не найден',
      robots: { index: false, follow: false },
    }
  }

  const { title, description } = buildPlanMeta(plan)
  // OG-картинка — из app/opengraph-image.tsx (общая). В будущем можно сделать
  // app/plan/[id]/opengraph-image.tsx с динамической ImageResponse под маршрут.
  return {
    title,
    description,
    alternates: { canonical: `/plan/${encodeURIComponent(id)}` },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `/plan/${encodeURIComponent(id)}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    // Реальные user-планы (UUID) НЕ индексируем — приватны.
    robots:
      id === 'example-spb' || id.startsWith('demo')
        ? { index: true, follow: true }
        : { index: false, follow: false },
  }
}

export default async function PlanPage({ params }: PageProps) {
  const { id } = await params
  const plan = await loadPlan(id)
  if (!plan) notFound()
  return <PlanView plan={plan} />
}
