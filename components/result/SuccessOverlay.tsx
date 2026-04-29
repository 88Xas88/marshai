'use client'

import { useEffect, useState } from 'react'

interface Props {
  open: boolean
  planId: string
  onClose: () => void
}

export function SuccessOverlay({ open, planId, onClose }: Props) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'saved' | 'error'>('idle')

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => onClose(), 8000)
    return () => clearTimeout(t)
  }, [open, onClose])

  if (!open) return null

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
      if (!res.ok) throw new Error()
      setState('saved')
      setTimeout(onClose, 1500)
    } catch {
      setState('error')
    }
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-40 animate-fade-in"
      style={{
        width: 'min(360px, calc(100vw - 32px))',
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-secondary)',
        borderRadius: '12px',
        padding: '14px',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 text-[13px]" style={{ fontWeight: 500 }}>
          <span
            className="inline-flex items-center justify-center"
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'var(--color-success)',
              color: '#fff',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M2 5l2 2 4-5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Открыли в новой вкладке
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="text-[16px] leading-none"
          style={{ color: 'var(--color-text-tertiary)', width: 24, height: 24 }}
        >
          ×
        </button>
      </div>
      <p
        className="text-[12px] mb-2.5"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Сохранить остальной план на email?
      </p>
      <form onSubmit={submit} className="flex gap-1.5">
        <input
          type="email"
          required
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-2.5 text-[12px] rounded-lg outline-none"
          style={{
            height: '36px',
            background: 'var(--color-background-tertiary)',
            border: '0.5px solid var(--color-border-tertiary)',
          }}
        />
        <button
          type="submit"
          disabled={state === 'sending' || state === 'saved'}
          className="px-3 text-[11px] rounded-lg whitespace-nowrap"
          style={{
            height: '36px',
            background: state === 'saved' ? 'var(--color-success)' : 'var(--color-primary)',
            color: '#fff',
            fontWeight: 500,
          }}
        >
          {state === 'saved' ? 'Сохранено' : state === 'sending' ? '...' : 'Сохранить'}
        </button>
      </form>
    </div>
  )
}
