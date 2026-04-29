'use client'

import { useMemo } from 'react'
import {
  BUDGET_LABELS,
  BUDGET_MIN,
  BUDGET_MAX,
  BUDGET_STEP,
  getBudgetRecommendation,
  nearestLabel,
} from '@/lib/cityBudget'
import { formatPrice } from '@/lib/format'

interface Props {
  value: number
  onChange: (value: number) => void
  toCity?: string
  days?: number
}

export function BudgetSelector({ value, onChange, toCity, days }: Props) {
  const recommendation = useMemo(
    () => getBudgetRecommendation(toCity, days ?? 0),
    [toCity, days]
  )

  const label = nearestLabel(value)
  const pct = ((value - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100

  function applyRecommendation() {
    if (recommendation) onChange(recommendation.recommended)
  }

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-baseline justify-between mb-3">
        <span
          className="text-[10px] uppercase tracking-wide"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Бюджет на человека
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-[16px]" style={{ fontWeight: 500 }}>
            {formatPrice(value)}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
            · {label}
          </span>
        </div>
      </div>

      <div className="relative">
        <input
          type="range"
          min={BUDGET_MIN}
          max={BUDGET_MAX}
          step={BUDGET_STEP}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          aria-label={`Бюджет ${formatPrice(value)}`}
          className="ms-range w-full block"
          style={
            {
              ['--ms-pct' as string]: `${pct}%`,
            } as React.CSSProperties
          }
        />
        {/* Метки под слайдером */}
        <div className="mt-2 grid grid-cols-5 text-[10px] gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
          {BUDGET_LABELS.map((l, i) => (
            <span
              key={l.label}
              className="text-center"
              style={{
                textAlign: i === 0 ? 'left' : i === BUDGET_LABELS.length - 1 ? 'right' : 'center',
              }}
            >
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {recommendation && (
        <div
          className="mt-4 rounded-[10px] p-3 animate-fade-in"
          style={{
            background: 'var(--color-background-tertiary)',
            border: '0.5px solid var(--color-border-tertiary)',
          }}
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-[12px]" style={{ fontWeight: 500 }}>
              💡 Для {toCity} на {days} дн.
              {recommendation.isDefault && (
                <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}>
                  {' '}(средняя оценка)
                </span>
              )}
            </span>
            <span className="text-[12px] price">
              {formatPrice(recommendation.min)} – {formatPrice(recommendation.max)}
            </span>
          </div>

          <ul
            className="text-[11px] grid gap-0.5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <BreakdownRow label="Транспорт туда+обратно" value={recommendation.breakdown.transport} />
            <BreakdownRow label={`Жильё (${Math.max((days ?? 1) - 1, 1)} ноч.)`} value={recommendation.breakdown.hotel} />
            <BreakdownRow label="Питание" value={recommendation.breakdown.food} />
            <BreakdownRow label="Музеи и активности" value={recommendation.breakdown.museums} />
            <li
              className="flex items-baseline justify-between mt-1.5 pt-1.5"
              style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}
            >
              <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>Итого</span>
              <span className="price text-[12px]">
                {formatPrice(recommendation.recommended)}
              </span>
            </li>
          </ul>

          {value !== recommendation.recommended && (
            <button
              type="button"
              onClick={applyRecommendation}
              className="mt-3 w-full text-[12px] px-3 rounded-lg"
              style={{
                height: '40px',
                background: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-secondary)',
                color: 'var(--color-text-primary)',
                fontWeight: 500,
              }}
            >
              Применить рекомендацию
            </button>
          )}
        </div>
      )}

      <style>{`
        .ms-range {
          -webkit-appearance: none;
          appearance: none;
          height: 40px;
          background: transparent;
          padding: 0;
          margin: 0;
          cursor: pointer;
        }
        .ms-range::-webkit-slider-runnable-track {
          height: 4px;
          border-radius: 4px;
          background: linear-gradient(
            to right,
            var(--color-primary) 0%,
            var(--color-primary) var(--ms-pct),
            var(--color-border-secondary) var(--ms-pct),
            var(--color-border-secondary) 100%
          );
        }
        .ms-range::-moz-range-track {
          height: 4px;
          border-radius: 4px;
          background: var(--color-border-secondary);
        }
        .ms-range::-moz-range-progress {
          height: 4px;
          border-radius: 4px;
          background: var(--color-primary);
        }
        .ms-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--color-primary);
          border: 2px solid var(--color-background-primary);
          margin-top: -9px;
          cursor: grab;
        }
        .ms-range::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--color-primary);
          border: 2px solid var(--color-background-primary);
          cursor: grab;
        }
        .ms-range:active::-webkit-slider-thumb {
          cursor: grabbing;
        }
        .ms-range:focus {
          outline: none;
        }
      `}</style>
    </div>
  )
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex items-baseline justify-between">
      <span>{label}</span>
      <span>~ {formatPrice(value)}</span>
    </li>
  )
}
