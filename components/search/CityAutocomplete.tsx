'use client'

import { useEffect, useRef, useState } from 'react'
import { searchCities } from '@/lib/cities'
import type { City } from '@/types/plan'

interface Props {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  exclude?: string
  error?: boolean
  autoFocus?: boolean
  id?: string
}

export function CityAutocomplete({
  label,
  value,
  onChange,
  placeholder,
  exclude,
  error,
  autoFocus,
  id,
}: Props) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions: City[] = value.length >= 2 ? searchCities(value, exclude) : []
  const showDropdown = open && suggestions.length > 0

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    setHighlight(0)
  }, [value])

  function pick(city: City) {
    onChange(city.name)
    setOpen(false)
    inputRef.current?.blur()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(suggestions[highlight])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 mb-1.5 text-[11px] font-medium uppercase tracking-wide"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {label}
        {error && (
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: '#E53935' }}
            aria-hidden
          />
        )}
      </label>
      <input
        id={id}
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        className="w-full px-3.5 text-[14px] rounded-lg outline-none transition-colors"
        style={{
          height: '48px',
          background: 'var(--color-background-primary)',
          border: error
            ? '1px solid #E53935'
            : '0.5px solid var(--color-border-secondary)',
          color: 'var(--color-text-primary)',
        }}
      />
      {showDropdown && (
        <div
          className="absolute left-0 right-0 mt-1 z-30 overflow-hidden animate-fade-in"
          style={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-secondary)',
            borderRadius: '8px',
            animationDuration: '120ms',
          }}
          role="listbox"
        >
          {suggestions.map((c, i) => (
            <button
              key={c.code}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(c)}
              onMouseEnter={() => setHighlight(i)}
              className="w-full text-left px-3.5 py-2.5 flex items-baseline justify-between transition-colors"
              style={{
                background:
                  i === highlight ? 'var(--color-background-tertiary)' : 'transparent',
              }}
            >
              <span className="text-[14px]">{c.name}</span>
              {c.region && (
                <span
                  className="text-[11px]"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {c.region}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
