'use client'

import { useEffect, useRef, useState } from 'react'

interface Option<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  label: string
  value: T
  onChange: (v: T) => void
  options: Option<T>[]
  icon?: React.ReactNode
}

export function ParamSelector<T extends string>({
  label,
  value,
  onChange,
  options,
  icon,
}: Props<T>) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const current = options.find((o) => o.value === value)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3.5 flex items-center gap-2 text-left rounded-lg transition-colors"
        style={{
          height: '48px',
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-secondary)',
        }}
      >
        {icon && (
          <span
            className="flex items-center"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {icon}
          </span>
        )}
        <span className="flex-1 min-w-0">
          <span
            className="block text-[10px] uppercase tracking-wide leading-none mb-0.5"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {label}
          </span>
          <span
            className="block text-[13px] truncate"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {current?.label}
          </span>
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 180ms ease',
            color: 'var(--color-text-tertiary)',
          }}
        >
          <path
            d="M2 4l3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div
          className="absolute left-0 right-0 mt-1 z-30 overflow-hidden animate-fade-in"
          style={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-secondary)',
            borderRadius: '8px',
            animationDuration: '120ms',
          }}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
              className="w-full text-left px-3.5 py-2.5 text-[13px] flex items-center justify-between transition-colors hover:bg-[var(--color-background-tertiary)]"
              style={{
                color:
                  o.value === value
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-secondary)',
                fontWeight: o.value === value ? 500 : 400,
              }}
            >
              {o.label}
              {o.value === value && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path
                    d="M2.5 6.2l2.4 2.4 4.6-5"
                    stroke="var(--color-success)"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
