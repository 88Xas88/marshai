import type { Metadata } from 'next'
import { PlanView } from '@/components/result/PlanView'
import { DEMO_PLAN } from '@/lib/demoPlan'
import { buildPlanMeta } from '@/lib/planMeta'

const planMeta = buildPlanMeta(DEMO_PLAN)

export const metadata: Metadata = {
  title: planMeta.title,
  description: planMeta.description,
  alternates: { canonical: '/plan/example-spb' },
  openGraph: {
    type: 'article',
    title: planMeta.title,
    description: planMeta.description,
    url: '/plan/example-spb',
  },
  twitter: {
    card: 'summary_large_image',
    title: planMeta.title,
    description: planMeta.description,
  },
}

export default function ExamplePlanPage() {
  return <PlanView plan={DEMO_PLAN} />
}
