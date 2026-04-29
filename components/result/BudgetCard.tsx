import { formatPrice, nightsLabel } from '@/lib/format'

interface Props {
  transportThere: number
  transportBack: number
  hotelTotal: number
  nights: number
  food?: number
  museums?: number
}

export function BudgetCard({
  transportThere,
  transportBack,
  hotelTotal,
  nights,
  food = 5000,
  museums = 2200,
}: Props) {
  const total = transportThere + transportBack + hotelTotal + food + museums

  const rows = [
    { label: 'Транспорт туда', value: transportThere },
    { label: 'Транспорт обратно', value: transportBack },
    { label: `Жильё · ${nightsLabel(nights)}`, value: hotelTotal },
    { label: 'Питание ~', value: food },
    { label: 'Музеи ~', value: museums },
  ]

  return (
    <section className="card p-4">
      <h3 className="text-[13px] mb-3" style={{ fontWeight: 500 }}>
        Бюджет
      </h3>
      <ul className="grid gap-1.5 mb-3">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex items-baseline justify-between text-[12px]"
          >
            <span style={{ color: 'var(--color-text-secondary)' }}>{r.label}</span>
            <span style={{ color: 'var(--color-text-primary)' }}>
              {formatPrice(r.value)}
            </span>
          </li>
        ))}
      </ul>
      <div
        className="pt-3 flex items-baseline justify-between"
        style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}
      >
        <span className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
          Итого от
        </span>
        <span className="price text-[18px]">{formatPrice(total)}</span>
      </div>
      <p
        className="mt-2 text-[10px]"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        Питание и музеи — приблизительно
      </p>
    </section>
  )
}
