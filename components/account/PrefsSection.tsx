'use client'

import { useState } from 'react'

interface Props {
  email?: string
  onLogout?: () => void
}

export function PrefsSection({ email, onLogout }: Props = {}) {
  const [priceAlerts, setPriceAlerts] = useState(true)
  const [tripReminder, setTripReminder] = useState(true)

  return (
    <div className="grid gap-4">
      <Group title="Уведомления">
        <Row
          icon={<BellIcon />}
          title="Изменение цен"
          subtitle="Email когда цены меняются"
          right={<Toggle on={priceAlerts} onChange={setPriceAlerts} />}
        />
        <Row
          icon={<CalendarIcon />}
          title="Напоминание о поездке"
          subtitle="За 3 дня до отъезда"
          right={<Toggle on={tripReminder} onChange={setTripReminder} />}
        />
      </Group>

      <Group title="Предпочтения">
        <Row
          icon={<MuseumIcon />}
          title="Интересы"
          subtitle="Музеи и история"
          right={<EditLink />}
        />
        <Row
          icon={<WalletIcon />}
          title="Бюджет"
          subtitle="Средний"
          right={<EditLink />}
        />
      </Group>

      <Group title="Аккаунт">
        {email && (
          <Row
            icon={<MailIcon />}
            title="Email"
            subtitle={email}
            right={null}
          />
        )}
        <Row
          icon={<LogoutIcon />}
          title="Выйти из аккаунта"
          subtitle=""
          danger
          onClick={onLogout}
        />
      </Group>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div
        className="text-[10px] uppercase tracking-wide mb-2 px-1"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {title}
      </div>
      <div className="card divide-y" style={{ borderColor: 'var(--color-border-tertiary)' }}>
        {children}
      </div>
    </section>
  )
}

function Row({
  icon,
  title,
  subtitle,
  right,
  onClick,
  danger,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  right?: React.ReactNode
  onClick?: () => void
  danger?: boolean
}) {
  const titleColor = danger ? '#C13838' : 'var(--color-text-primary)'
  const iconColor = danger ? '#C13838' : 'var(--color-text-secondary)'
  const iconBg = danger ? '#FCEBEB' : 'var(--color-background-tertiary)'
  const cursor = onClick ? 'pointer' : 'default'

  const inner = (
    <>
      <span
        aria-hidden
        className="inline-flex items-center justify-center shrink-0"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: iconBg,
          color: iconColor,
        }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px]" style={{ fontWeight: 500, color: titleColor }}>
          {title}
        </div>
        {subtitle && (
          <div className="text-[11px] truncate" style={{ color: 'var(--color-text-secondary)' }}>
            {subtitle}
          </div>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center gap-3 p-3.5 text-left"
        style={{ minHeight: '56px', cursor }}
      >
        {inner}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3 p-3.5" style={{ minHeight: '56px' }}>
      {inner}
    </div>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="relative inline-flex items-center"
      style={{
        width: '36px',
        height: '20px',
        borderRadius: '20px',
        background: on ? 'var(--color-success)' : 'var(--color-border-secondary)',
        transition: 'background 150ms ease',
      }}
    >
      <span
        className="inline-block rounded-full"
        style={{
          width: '16px',
          height: '16px',
          background: '#fff',
          transform: on ? 'translateX(18px)' : 'translateX(2px)',
          transition: 'transform 150ms ease',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}
      />
    </button>
  )
}

function EditLink() {
  return (
    <button
      type="button"
      className="text-[11px]"
      style={{ color: 'var(--color-text-secondary)' }}
    >
      Изменить →
    </button>
  )
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M3.5 11.5h9l-1.2-1.5V7c0-1.8-1.5-3.3-3.3-3.3S4.7 5.2 4.7 7v3l-1.2 1.5z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M6.5 13c.3.5.9.8 1.5.8s1.2-.3 1.5-.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.4" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.5 6.5h11" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.5 2.5v2M10.5 2.5v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function MuseumIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 6.5L8 3l6 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M3.5 7v5M6 7v5M10 7v5M12.5 7v5M2 13.5h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function WalletIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="4" width="12" height="9" rx="1.4" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 6.5h10a2 2 0 012 2V11" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="11" cy="9.2" r="0.8" fill="currentColor" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3.5" width="12" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.3 4.5l5.7 4.3 5.7-4.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M9 3H4a1 1 0 00-1 1v8a1 1 0 001 1h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 5l3 3-3 3M7.5 8H14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
