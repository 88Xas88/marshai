'use client'

import type { ReactNode } from 'react'

export type EmptyStateType =
  | 'no_trips'
  | 'no_flights'
  | 'load_error'
  | 'no_results'

interface Props {
  type: EmptyStateType
  onAction?: () => void
  customTitle?: string
  customSubtitle?: string
  customAction?: string
  extra?: ReactNode
}

const CONFIG: Record<
  EmptyStateType,
  {
    bg: string
    fg: string
    icon: ReactNode
    title: string
    subtitle: string
    action: string
  }
> = {
  no_trips: {
    bg: '#E1F5EE',
    fg: '#085041',
    icon: <PinIcon />,
    title: 'Ещё нет поездок',
    subtitle: 'Запланируй первую — займёт около 30 секунд',
    action: 'Спланировать',
  },
  no_flights: {
    bg: '#FCEBEB',
    fg: '#9C2E2E',
    icon: <PlaneIcon />,
    title: 'Рейсов не нашлось',
    subtitle: 'Прямых рейсов нет на эти даты',
    action: 'Попробовать ±1 день',
  },
  load_error: {
    bg: '#FAEEDA',
    fg: '#6B4A12',
    icon: <WarnIcon />,
    title: 'Что-то пошло не так',
    subtitle: 'Не смогли загрузить данные',
    action: 'Обновить',
  },
  no_results: {
    bg: '#EEEDFE',
    fg: '#5A4DCC',
    icon: <SearchIcon />,
    title: 'Ничего не найдено',
    subtitle: 'Попробуй другой город или даты',
    action: 'Сбросить фильтр',
  },
}

export function EmptyState({
  type,
  onAction,
  customTitle,
  customSubtitle,
  customAction,
  extra,
}: Props) {
  const c = CONFIG[type]
  return (
    <div className="card p-6 sm:p-8 flex flex-col items-center text-center gap-3">
      <span
        aria-hidden
        className="inline-flex items-center justify-center"
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: c.bg,
          color: c.fg,
        }}
      >
        {c.icon}
      </span>
      <h3 className="text-[15px]" style={{ fontWeight: 500 }}>
        {customTitle ?? c.title}
      </h3>
      <p
        className="text-[12px] max-w-[280px]"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {customSubtitle ?? c.subtitle}
      </p>
      {extra}
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-1 px-4 text-[13px] rounded-lg"
          style={{
            height: '44px',
            background: 'var(--color-primary)',
            color: '#fff',
            fontWeight: 500,
            minWidth: '180px',
          }}
        >
          {customAction ?? c.action}
        </button>
      )}
    </div>
  )
}

function PinIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path
        d="M11 2.5c-3.3 0-6 2.7-6 6 0 4.5 6 11 6 11s6-6.5 6-11c0-3.3-2.7-6-6-6z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="11" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function PlaneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path
        d="M11 2l2.5 7.5L20 11l-6.5 1.5L11 20l-2.5-7.5L2 11l6.5-1.5L11 2z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function WarnIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path
        d="M11 3l9 16H2L11 3z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M11 9v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="11" cy="16" r="0.8" fill="currentColor" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="9.5" cy="9.5" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M14 14l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
