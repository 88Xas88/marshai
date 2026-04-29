interface Props {
  text: string
}

export function AiTipCard({ text }: Props) {
  return (
    <section className="card p-4">
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden
          className="inline-flex items-center justify-center shrink-0"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: '#EEEDFE',
            color: '#5A4DCC',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1.5l1.4 3.7L12 6.5l-3.6 1.3L7 11.5l-1.4-3.7L2 6.5l3.6-1.3L7 1.5z"
              fill="currentColor"
            />
          </svg>
        </span>
        <div>
          <div className="text-[12px]" style={{ fontWeight: 500 }}>
            Совет ИИ
          </div>
          <p
            className="text-[12px] mt-0.5"
            style={{ color: 'var(--color-text-secondary)', lineHeight: 1.45 }}
          >
            {text}
          </p>
        </div>
      </div>
    </section>
  )
}
