'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ERRORS: Record<string, string> = {
  invalid_session: 'Сессия истекла, войдите заново.',
  invalid_token: 'Ссылка устарела или уже использована. Запросите новую.',
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  )
}

function LoginInner() {
  const sp = useSearchParams()
  const initialError = sp.get('error') ?? null

  const [email, setEmail] = useState('')
  const [stage, setStage] = useState<'form' | 'sent'>('form')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(initialError)
  const [sentTo, setSentTo] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!EMAIL_RE.test(trimmed)) {
      setError('Введите корректный email')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/send-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      const data = (await res.json()) as { ok: boolean; error?: string }
      if (!res.ok || !data.ok) {
        setError(humanizeApiError(data.error))
        return
      }
      setSentTo(trimmed)
      setStage('sent')
    } catch {
      setError('Не удалось связаться с сервером')
    } finally {
      setSubmitting(false)
    }
  }

  async function resend() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/send-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: sentTo }),
      })
      const data = (await res.json()) as { ok: boolean; error?: string }
      if (!res.ok || !data.ok) {
        setError(humanizeApiError(data.error))
      }
    } catch {
      setError('Не удалось отправить повторно')
    } finally {
      setSubmitting(false)
    }
  }

  function changeEmail() {
    setStage('form')
    setError(null)
  }

  return (
    <AuthLayout>
      {stage === 'form' ? (
        <FormView
          email={email}
          setEmail={(v) => {
            setEmail(v)
            if (error) setError(null)
          }}
          onSubmit={submit}
          submitting={submitting}
          error={error ? ERRORS[error] ?? error : null}
        />
      ) : (
        <SentView
          email={sentTo}
          onResend={resend}
          onChange={changeEmail}
          submitting={submitting}
          error={error}
        />
      )}
    </AuthLayout>
  )
}

function humanizeApiError(code?: string): string {
  switch (code) {
    case 'invalid_email': return 'Введите корректный email'
    case 'database_unavailable': return 'База данных недоступна, попробуйте позже'
    case 'token_create_failed': return 'Не удалось создать ссылку — попробуйте ещё раз'
    default: return 'Не получилось отправить ссылку'
  }
}

interface FormViewProps {
  email: string
  setEmail: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  submitting: boolean
  error: string | null
}

function FormView({ email, setEmail, onSubmit, submitting, error }: FormViewProps) {
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
        <PinIcon />
      </span>
      <h1 className="text-[20px] mt-1" style={{ fontWeight: 500, letterSpacing: '-0.3px' }}>
        Войти в Marshai
      </h1>
      <p
        className="text-[14px] text-center max-w-[320px]"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Сохраняй планы и следи за изменением цен
      </p>

      <form onSubmit={onSubmit} className="w-full grid gap-2 mt-3">
        <input
          type="email"
          required
          autoFocus
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@mail.ru"
          className="w-full px-3.5 text-[14px] rounded-lg outline-none"
          style={{
            height: '48px',
            background: 'var(--color-background-primary)',
            border: error
              ? '1px solid #E53935'
              : '0.5px solid var(--color-border-secondary)',
          }}
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 text-[14px] rounded-lg"
          style={{
            height: '48px',
            background: 'var(--color-primary)',
            color: '#fff',
            fontWeight: 500,
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? 'Отправляем...' : 'Получить ссылку для входа'}
        </button>
        {error && (
          <p className="text-[12px]" style={{ color: '#C13838' }}>{error}</p>
        )}
      </form>

      <p
        className="mt-2 text-[11px] text-center"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        Нажимая «Войти», вы соглашаетесь с условиями использования
        и политикой конфиденциальности.
      </p>
    </>
  )
}

interface SentViewProps {
  email: string
  onResend: () => void
  onChange: () => void
  submitting: boolean
  error: string | null
}

function SentView({ email, onResend, onChange, submitting, error }: SentViewProps) {
  return (
    <>
      <span
        aria-hidden
        className="inline-flex items-center justify-center animate-pulse-dot"
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'var(--color-avatar-teal)',
          color: 'var(--color-avatar-teal-text)',
        }}
      >
        <MailIcon />
      </span>
      <h1 className="text-[20px] mt-1" style={{ fontWeight: 500, letterSpacing: '-0.3px' }}>
        Проверьте почту
      </h1>
      <p
        className="text-[14px] text-center"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Мы отправили ссылку на<br />
        <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{email}</span>
      </p>
      <p
        className="text-[11px]"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        Ссылка действительна 15 минут
      </p>

      <div className="w-full grid gap-2 mt-3">
        <button
          type="button"
          onClick={onResend}
          disabled={submitting}
          className="w-full px-4 text-[13px] rounded-lg"
          style={{
            height: '44px',
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-secondary)',
            color: 'var(--color-text-primary)',
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? 'Отправляем...' : 'Отправить снова'}
        </button>
        <button
          type="button"
          onClick={onChange}
          className="w-full text-[12px]"
          style={{
            color: 'var(--color-text-secondary)',
            minHeight: '44px',
          }}
        >
          Изменить email
        </button>
      </div>

      {error && (
        <p className="text-[12px]" style={{ color: '#C13838' }}>{error}</p>
      )}
    </>
  )
}

function PinIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2.5c-3.6 0-6.5 2.9-6.5 6.5 0 5 6.5 12 6.5 12s6.5-7 6.5-12c0-3.6-2.9-6.5-6.5-6.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5.5" width="18" height="13" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 7l8.5 6.5L20.5 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
