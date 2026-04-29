'use client'

import { useState } from 'react'

interface Props {
  planId: string
}

export function SavePlanCard({ planId }: Props) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'saved' | 'error'>('idle')
  const [showAuthHint, setShowAuthHint] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) return
    setState('sending')
    try {
      const res = await fetch('/api/save-plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ planId, email }),
      })
      if (!res.ok) throw new Error('save failed')
      setState('saved')
      setShowAuthHint(true)
    } catch {
      setState('error')
    }
  }

  return (
    <section id="save-plan" className="card p-4">
      <h3 className="text-[13px] mb-1" style={{ fontWeight: 500 }}>
        Сохранить план
      </h3>
      <p
        className="text-[11px] mb-3"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Пришлём ссылку + уведомим, если цены изменятся
      </p>

      <form onSubmit={submit} className="flex gap-1.5">
        <input
          type="email"
          required
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-3 text-[13px] rounded-lg outline-none"
          style={{
            height: '44px',
            background: 'var(--color-background-tertiary)',
            border: '0.5px solid var(--color-border-tertiary)',
          }}
        />
        <button
          type="submit"
          disabled={state === 'sending' || state === 'saved'}
          className="px-3.5 text-[12px] rounded-lg whitespace-nowrap"
          style={{
            height: '44px',
            background:
              state === 'saved'
                ? 'var(--color-success)'
                : 'var(--color-primary)',
            color: '#fff',
            fontWeight: 500,
            opacity: state === 'sending' ? 0.7 : 1,
          }}
        >
          {state === 'saved' ? 'Сохранено ✓' : state === 'sending' ? '...' : 'Сохранить'}
        </button>
      </form>

      {state === 'error' && (
        <p className="mt-2 text-[11px]" style={{ color: '#C13838' }}>
          Не получилось сохранить — попробуй ещё раз
        </p>
      )}

      {showAuthHint && (
        <div
          className="mt-3 p-2.5 rounded-[8px] flex items-center justify-between gap-2 animate-fade-in"
          style={{
            background: 'var(--color-background-tertiary)',
            border: '0.5px solid var(--color-border-tertiary)',
          }}
        >
          <span
            className="text-[11px]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Планы будут сохраняться автоматически
          </span>
          <button
            type="button"
            className="px-2.5 text-[11px] rounded-lg whitespace-nowrap"
            style={{
              height: '32px',
              background: 'var(--color-success)',
              color: '#fff',
              fontWeight: 500,
            }}
          >
            Войти через Google →
          </button>
        </div>
      )}
    </section>
  )
}
