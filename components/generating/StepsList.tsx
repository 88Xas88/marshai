'use client'

import type { GenerationStep } from '@/types/plan'

interface Props {
  steps: GenerationStep[]
  countdown: number | null
}

export function StepsList({ steps, countdown }: Props) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-[11px] uppercase tracking-wide"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Генерация плана
        </span>
        <span
          className="text-[12px]"
          style={{
            color:
              countdown === null
                ? 'var(--color-success)'
                : 'var(--color-text-secondary)',
          }}
        >
          {countdown === null ? 'Готово!' : `~${countdown} сек`}
        </span>
      </div>

      <ol className="grid gap-3">
        {steps.map((s) => (
          <Step key={s.id} step={s} />
        ))}
      </ol>
    </div>
  )
}

function Step({ step }: { step: GenerationStep }) {
  return (
    <li className="flex items-center gap-3 text-[13px]">
      <Indicator status={step.status} />
      <span
        style={{
          color:
            step.status === 'pending'
              ? 'var(--color-text-tertiary)'
              : 'var(--color-text-primary)',
          fontWeight: step.status === 'active' ? 500 : 400,
        }}
      >
        {step.label}
      </span>
    </li>
  )
}

function Indicator({ status }: { status: GenerationStep['status'] }) {
  if (status === 'done') {
    return (
      <span
        className="inline-flex items-center justify-center shrink-0 animate-fade-in"
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: 'var(--color-primary)',
          color: '#fff',
          animationDuration: '200ms',
        }}
        aria-label="готово"
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
    )
  }
  if (status === 'active') {
    return (
      <span
        className="inline-flex items-center justify-center shrink-0"
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: 'rgba(29,158,117,0.10)',
        }}
        aria-label="в процессе"
      >
        <span
          className="inline-block animate-pulse-dot rounded-full"
          style={{
            width: '6px',
            height: '6px',
            background: 'var(--color-success)',
          }}
        />
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span
        className="inline-flex items-center justify-center shrink-0"
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: '#FCEBEB',
          color: '#C13838',
          fontSize: '11px',
        }}
        aria-label="ошибка"
      >
        ×
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center justify-center shrink-0"
      style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        border: '0.5px solid var(--color-border-secondary)',
        background: 'transparent',
      }}
      aria-label="ожидание"
    >
      <span
        className="inline-block rounded-full"
        style={{
          width: '4px',
          height: '4px',
          background: 'var(--color-border-secondary)',
        }}
      />
    </span>
  )
}
