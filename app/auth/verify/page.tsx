'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'

type Stage = 'loading' | 'error'

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  )
}

function VerifyInner() {
  const router = useRouter()
  const sp = useSearchParams()
  const token = sp.get('token') ?? ''
  const email = sp.get('email') ?? ''

  const [stage, setStage] = useState<Stage>('loading')
  // Strict-mode dev запускает useEffect дважды → токен будет «использован» вторым вызовом.
  // Защищаемся от этого ref-флагом.
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true

    if (!token || !email) {
      setStage('error')
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ token, email }),
        })
        const data = (await res.json()) as { ok: boolean }
        if (cancelled) return
        if (res.ok && data.ok) {
          router.replace('/account')
        } else {
          setStage('error')
        }
      } catch {
        if (!cancelled) setStage('error')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, email, router])

  return (
    <AuthLayout>
      {stage === 'loading' ? <LoadingView /> : <ErrorView />}
    </AuthLayout>
  )
}

function LoadingView() {
  return (
    <>
      <span
        aria-hidden
        className="inline-flex items-center justify-center"
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'var(--color-avatar-teal)',
          color: 'var(--color-avatar-teal-text)',
        }}
      >
        <span
          className="inline-block animate-pulse-dot rounded-full"
          style={{ width: '12px', height: '12px', background: 'currentColor' }}
        />
      </span>
      <h1 className="text-[20px] mt-1" style={{ fontWeight: 500, letterSpacing: '-0.3px' }}>
        Входим...
      </h1>
      <p className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
        Проверяем ссылку
      </p>
    </>
  )
}

function ErrorView() {
  return (
    <>
      <span
        aria-hidden
        className="inline-flex items-center justify-center"
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: '#FCEBEB',
          color: '#9C2E2E',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 7v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="16.5" r="1" fill="currentColor" />
        </svg>
      </span>
      <h1 className="text-[20px] mt-1" style={{ fontWeight: 500, letterSpacing: '-0.3px' }}>
        Ссылка устарела
      </h1>
      <p
        className="text-[13px] text-center max-w-[300px]"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Ссылка устарела или уже была использована.<br />
        Ссылки действительны 15 минут.
      </p>
      <Link
        href="/account/login"
        className="mt-3 px-4 text-[14px] rounded-lg flex items-center justify-center"
        style={{
          height: '44px',
          background: 'var(--color-primary)',
          color: '#fff',
          fontWeight: 500,
          minWidth: '220px',
        }}
      >
        Запросить новую ссылку
      </Link>
    </>
  )
}
