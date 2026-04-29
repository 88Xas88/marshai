'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CityAutocomplete } from './CityAutocomplete'
import { ParamSelector } from './ParamSelector'
import { BudgetSelector } from './BudgetSelector'
import { BUDGET_DEFAULT } from '@/lib/cityBudget'
import type { InterestType } from '@/types/plan'

const PAX_OPTIONS = [
  { value: '1', label: '1 человек' },
  { value: '2', label: '2 человека' },
  { value: '3', label: '3 человека' },
  { value: '4', label: '4 человека' },
  { value: '5+', label: '5 и более' },
] as const

const INTEREST_OPTIONS: { value: InterestType; label: string }[] = [
  { value: 'museums', label: 'Музеи и история' },
  { value: 'food', label: 'Рестораны и еда' },
  { value: 'walks', label: 'Прогулки' },
  { value: 'all', label: 'Всё понемногу' },
]

interface Hint {
  to: string
  depart: string  // ISO YYYY-MM-DD
  ret: string     // ISO YYYY-MM-DD
  label: string
}

// Все даты в подсказках — относительно сегодня, чтобы они всегда оставались в будущем.
function buildHints(): Hint[] {
  const today = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const addDays = (n: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + n)
    return d
  }
  return [
    { to: 'Санкт-Петербург', depart: iso(addDays(7)),   ret: iso(addDays(11)),  label: 'Питер на майские' },
    { to: 'Сочи',            depart: iso(addDays(30)),  ret: iso(addDays(36)),  label: 'Сочи летом' },
    { to: 'Казань',          depart: iso(addDays(14)),  ret: iso(addDays(16)),  label: 'Казань на выходные' },
    { to: 'Калининград',     depart: iso(addDays(45)),  ret: iso(addDays(49)),  label: 'Калининград' },
    { to: 'Владивосток',     depart: iso(addDays(60)),  ret: iso(addDays(67)),  label: 'Владивосток' },
  ]
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function diffDays(a: string, b: string): number {
  if (!a || !b) return 0
  const t1 = new Date(a).getTime()
  const t2 = new Date(b).getTime()
  if (Number.isNaN(t1) || Number.isNaN(t2)) return 0
  return Math.max(1, Math.round((t2 - t1) / 86400000))
}

// "2026-05-10" → "10"
function dayOf(iso: string): string {
  return iso.slice(8, 10)
}
// "2026-05-10" → "05"
function monthOf(iso: string): string {
  return iso.slice(5, 7)
}

// "2026-05-10" + "2026-05-15" → "10-15.05"  (формат, который понимает inferDateRange)
function buildDatesParam(depart: string, ret: string): string {
  if (!depart) return 'ближайшие даты'
  const d1 = dayOf(depart)
  const m1 = monthOf(depart)
  if (!ret) return `${d1}.${m1}`
  const d2 = dayOf(ret)
  const m2 = monthOf(ret)
  // Если разные месяцы — сохраняем оба, чтобы не потерять информацию.
  if (m1 !== m2) return `${d1}.${m1}-${d2}.${m2}`
  return `${d1}-${d2}.${m1}`
}

export function SearchForm() {
  const router = useRouter()
  const HINTS = useMemo(buildHints, [])
  const today = useMemo(todayIso, [])

  const [from, setFrom] = useState('Москва')
  const [to, setTo] = useState('')
  const [depart, setDepart] = useState('')
  const [ret, setRet] = useState('')
  const [days, setDays] = useState<string>('5')
  const [pax, setPax] = useState<string>('1')
  const [budget, setBudget] = useState<number>(BUDGET_DEFAULT)
  const [interests, setInterests] = useState<InterestType>('all')
  const [toError, setToError] = useState(false)
  const [daysManual, setDaysManual] = useState(false)

  // Автоподсчёт дней при выборе обеих дат — только если пользователь не правил поле руками.
  useEffect(() => {
    if (daysManual) return
    if (depart && ret) {
      const n = diffDays(depart, ret)
      if (n > 0) setDays(String(n))
    }
  }, [depart, ret, daysManual])

  // Если выбран обратный раньше тура — подтянем обратный к туру.
  useEffect(() => {
    if (depart && ret && ret < depart) setRet(depart)
  }, [depart, ret])

  const canSubmit = to.trim().length > 0

  function submit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!canSubmit) {
      setToError(true)
      return
    }
    const dates = buildDatesParam(depart, ret)
    const params = new URLSearchParams({
      from,
      to,
      dates,
      days,
      pax,
      budget: String(budget),
      interests,
    })
    router.push(`/generating?${params.toString()}`)
  }

  function applyHint(h: Hint) {
    setTo(h.to)
    setDepart(h.depart)
    setRet(h.ret)
    setDaysManual(false)
    setToError(false)
  }

  return (
    <form
      onSubmit={submit}
      className="card p-4 sm:p-5"
      style={{ borderRadius: '16px' }}
    >
      <div className="grid gap-3 md:grid-cols-2 md:items-end">
        <CityAutocomplete
          id="from"
          label="Откуда"
          value={from}
          onChange={setFrom}
          placeholder="Например, Москва"
          exclude={to}
        />
        <CityAutocomplete
          id="to"
          label="Куда"
          value={to}
          onChange={(v) => {
            setTo(v)
            if (v) setToError(false)
          }}
          placeholder="Куда хотите?"
          exclude={from}
          error={toError}
        />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_120px_auto] md:items-end">
        <DateField
          id="depart"
          label="Туда"
          value={depart}
          onChange={(v) => {
            setDepart(v)
            // Если "обратно" не выбран — предложим +1 день.
            if (v && !ret) {
              const next = new Date(v)
              next.setDate(next.getDate() + 1)
              setRet(next.toISOString().slice(0, 10))
            }
          }}
          min={today}
        />
        <DateField
          id="return"
          label="Обратно"
          value={ret}
          onChange={setRet}
          min={depart || today}
        />
        <div>
          <label
            htmlFor="days"
            className="block mb-1.5 text-[11px] font-medium uppercase tracking-wide"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Дней
          </label>
          <input
            id="days"
            type="number"
            min={1}
            max={14}
            value={days}
            onChange={(e) => {
              setDays(e.target.value)
              setDaysManual(true)
            }}
            className="w-full px-3 text-[14px] rounded-lg outline-none text-center"
            style={{
              height: '48px',
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-secondary)',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full md:w-auto px-5 text-[14px] rounded-lg transition-opacity"
          style={{
            height: '48px',
            background: canSubmit ? 'var(--color-primary)' : 'var(--color-border-secondary)',
            color: canSubmit ? '#fff' : 'var(--color-text-tertiary)',
            fontWeight: 500,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            minWidth: '160px',
          }}
        >
          Составить план
        </button>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        <ParamSelector<string>
          label="Кол-во человек"
          value={pax}
          onChange={setPax}
          options={[...PAX_OPTIONS]}
          icon={<UsersIcon />}
        />
        <ParamSelector<InterestType>
          label="Интересы"
          value={interests}
          onChange={setInterests}
          options={INTEREST_OPTIONS}
          icon={<HeartIcon />}
        />
      </div>

      <div className="mt-3">
        <BudgetSelector
          value={budget}
          onChange={setBudget}
          toCity={to.trim() || undefined}
          days={parseInt(days, 10) || undefined}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {HINTS.map((h) => (
          <button
            key={h.label}
            type="button"
            className="pill"
            onClick={() => applyHint(h)}
          >
            {h.label}
          </button>
        ))}
      </div>
    </form>
  )
}

interface DateFieldProps {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  min?: string
}

function DateField({ id, label, value, onChange, min }: DateFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block mb-1.5 text-[11px] font-medium uppercase tracking-wide"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {label}
      </label>
      <div className="relative">
        <span
          aria-hidden
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <CalendarIcon />
        </span>
        <input
          id={id}
          type="date"
          value={value}
          min={min}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-9 pr-3 text-[14px] rounded-lg outline-none"
          style={{
            height: '48px',
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-secondary)',
            color: value
              ? 'var(--color-text-primary)'
              : 'var(--color-text-tertiary)',
          }}
        />
      </div>
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.4" stroke="currentColor" strokeWidth="1.1" />
      <path d="M2.5 6.5h11" stroke="currentColor" strokeWidth="1.1" />
      <path d="M5.5 2.2v2.6M10.5 2.2v2.6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="6" cy="5" r="2.4" stroke="currentColor" strokeWidth="1.1" />
      <path d="M2 13c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="11.5" cy="5.5" r="1.7" stroke="currentColor" strokeWidth="1.1" />
      <path d="M10 9.6c2.2 0 4 1.4 4 3.4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 13.5s-5-3.1-5-7A2.8 2.8 0 018 4.6a2.8 2.8 0 015 1.9c0 3.9-5 7-5 7z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  )
}
