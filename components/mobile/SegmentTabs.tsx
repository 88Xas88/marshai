'use client'

import { useEffect, useRef, useState } from 'react'

interface Tab {
  id: string
  label: string
}

interface Props {
  tabs: Tab[]
  defaultActive?: string
}

export function SegmentTabs({ tabs, defaultActive }: Props) {
  const [active, setActive] = useState<string>(defaultActive ?? tabs[0]?.id ?? '')
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY
      setHidden(y > lastY.current && y > 80)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Вычисляем активный таб по скроллу
  useEffect(() => {
    function detectActive() {
      let current = tabs[0]?.id ?? ''
      for (const t of tabs) {
        const el = document.getElementById(t.id)
        if (!el) continue
        const top = el.getBoundingClientRect().top
        if (top - 120 <= 0) current = t.id
      }
      setActive(current)
    }
    detectActive()
    window.addEventListener('scroll', detectActive, { passive: true })
    return () => window.removeEventListener('scroll', detectActive)
  }, [tabs])

  function go(id: string) {
    const el = document.getElementById(id)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 100
    window.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <div
      className="sticky top-14 z-10 sm:hidden"
      style={{
        background: 'var(--color-background-tertiary)',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 250ms ease',
      }}
    >
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4">
        {tabs.map((t) => {
          const isActive = t.id === active
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => go(t.id)}
              className="text-[12px] whitespace-nowrap py-2.5 transition-colors"
              style={{
                color: isActive
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-secondary)',
                fontWeight: isActive ? 500 : 400,
                borderBottom: isActive
                  ? '2px solid var(--color-primary)'
                  : '2px solid transparent',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
