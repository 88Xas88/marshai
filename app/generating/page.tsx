'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { StepsList } from '@/components/generating/StepsList'
import { EngageQuestions } from '@/components/generating/EngageQuestions'
import { PreviewPanel } from '@/components/generating/PreviewPanel'
import { usePlanStore } from '@/store/planStore'
import type { EngageAnswers, Flight, Hotel, DayPlan, OptimalSelection } from '@/types/plan'

const COUNTDOWN_START = 28
const PARTIAL_CTA_MS = 15000

export default function GeneratingPage() {
  return (
    <Suspense fallback={null}>
      <GeneratingInner />
    </Suspense>
  )
}

interface FlightsEvent {
  there: Flight[]
  back: Flight[]
}
interface ItineraryEvent {
  days: DayPlan[]
  optimal: OptimalSelection
}

function GeneratingInner() {
  const router = useRouter()
  const sp = useSearchParams()
  const reset = usePlanStore((s) => s.reset)
  const setFlights = usePlanStore((s) => s.setFlights)
  const setHotels = usePlanStore((s) => s.setHotels)
  const setItinerary = usePlanStore((s) => s.setItinerary)
  const setOptimal = usePlanStore((s) => s.setOptimal)
  const updateStep = usePlanStore((s) => s.updateStep)
  const steps = usePlanStore((s) => s.steps)

  const [countdown, setCountdown] = useState<number | null>(COUNTDOWN_START)
  const [planId, setPlanId] = useState<string | null>(null)
  const [showPartialCta, setShowPartialCta] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const engageRef = useRef<EngageAnswers>({})

  // Reset store on mount
  useEffect(() => {
    reset()
    // Старт сразу, не ждём ответов
    updateStep('flights', 'active')
    updateStep('hotels', 'active')
    updateStep('itinerary', 'active')
  }, [reset, updateStep])

  // Countdown
  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) {
      setCountdown(null)
      return
    }
    const t = setTimeout(() => setCountdown((c) => (c == null ? c : c - 1)), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // Partial CTA after 15s
  useEffect(() => {
    const t = setTimeout(() => setShowPartialCta(true), PARTIAL_CTA_MS)
    return () => clearTimeout(t)
  }, [])

  // SSE
  useEffect(() => {
    const url = `/api/generate/stream?${sp.toString()}`
    const es = new EventSource(url)

    es.addEventListener('flights', (e: MessageEvent) => {
      const data = JSON.parse(e.data) as FlightsEvent
      setFlights(data.there ?? [], data.back ?? [])
      updateStep('flights', 'done')
    })
    es.addEventListener('hotels', (e: MessageEvent) => {
      const data = JSON.parse(e.data) as Hotel[]
      setHotels(data ?? [])
      updateStep('hotels', 'done')
    })
    es.addEventListener('itinerary', (e: MessageEvent) => {
      const data = JSON.parse(e.data) as ItineraryEvent
      setItinerary(data.days ?? [])
      setOptimal(data.optimal)
      updateStep('itinerary', 'done')
      updateStep('map', 'done')
    })
    es.addEventListener('error', (e: MessageEvent) => {
      try {
        const data = JSON.parse((e as MessageEvent).data ?? '{}') as { stage?: string }
        if (data.stage) updateStep(data.stage, 'error')
      } catch {
        /* connection-level error — игнор, EventSource переподключится */
      }
    })
    es.addEventListener('done', (e: MessageEvent) => {
      const data = JSON.parse(e.data) as { planId: string }
      updateStep('final', 'done')
      setCountdown(null)
      setPlanId(data.planId)
      es.close()
    })

    es.onerror = () => {
      // Если совсем падает — показываем ошибку и закрываем
      if (es.readyState === EventSource.CLOSED) {
        setError('Не удалось получить ответ. Попробуй обновить.')
      }
    }

    return () => es.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Redirect when done
  useEffect(() => {
    if (planId) {
      const t = setTimeout(() => router.push(`/plan/${planId}`), 500)
      return () => clearTimeout(t)
    }
  }, [planId, router])

  function showPartial() {
    if (planId) router.push(`/plan/${planId}`)
    else router.push('/plan/example-spb')
  }

  return (
    <div className="min-h-dvh">
      <header
        style={{
          background: 'var(--color-background-tertiary)',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
        }}
      >
        <div className="mx-auto max-w-[1080px] h-14 px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-flex items-center justify-center"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: 'var(--color-primary)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              M
            </span>
            <span className="text-[14px]" style={{ fontWeight: 500 }}>Marshai</span>
          </Link>
          <span
            className="text-[12px]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {sp.get('from') ?? '—'} → {sp.get('to') ?? '—'}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[1080px] px-4 py-6 grid gap-4 lg:grid-cols-2">
        <div className="grid gap-4">
          <StepsList steps={steps} countdown={countdown} />
          <EngageQuestions
            onAnswer={(a) => {
              engageRef.current = a
            }}
          />
          {showPartialCta && !planId && (
            <button
              type="button"
              onClick={showPartial}
              className="text-[12px] self-start px-3 rounded-lg animate-fade-in"
              style={{
                height: '36px',
                background: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-secondary)',
                color: 'var(--color-text-primary)',
              }}
            >
              Показать что уже нашли →
            </button>
          )}
          {error && (
            <div
              className="card p-3 text-[12px]"
              style={{ color: '#C13838', borderColor: '#FCEBEB' }}
            >
              {error}
            </div>
          )}
        </div>
        <div>
          <PreviewPanel />
        </div>
      </main>
    </div>
  )
}
