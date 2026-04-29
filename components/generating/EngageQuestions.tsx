'use client'

import { useEffect, useState } from 'react'
import type { EngageAnswers } from '@/types/plan'

interface Q {
  key: keyof EngageAnswers
  title: string
  options: string[]
  doneNote?: string
}

const QUESTIONS: Q[] = [
  {
    key: 'priority',
    title: 'Пока ищем — уточним план. Что важнее в поездке?',
    options: [
      'Музеи и история',
      'Рестораны и еда',
      'Прогулки и природа',
      'Шоппинг',
      'Всё понемногу',
    ],
  },
  {
    key: 'pace',
    title: 'Какой темп предпочитаешь?',
    options: ['Насыщенный — максимум мест', 'Размеренный — без спешки', 'Смешанный'],
  },
  {
    key: 'dailyBudget',
    title: 'Бюджет на день (без жилья)?',
    options: ['до 2 000 ₽', 'до 4 000 ₽', 'Свободно'],
    doneNote: 'Всё учтём — план будет именно под тебя ✓',
  },
]

interface Props {
  onAnswer?: (answers: EngageAnswers) => void
}

export function EngageQuestions({ onAnswer }: Props) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<EngageAnswers>({})
  const [showDoneNote, setShowDoneNote] = useState(false)

  useEffect(() => {
    onAnswer?.(answers)
  }, [answers, onAnswer])

  function pick(q: Q, value: string) {
    const next = { ...answers, [q.key]: value }
    setAnswers(next)
    if (step < QUESTIONS.length - 1) {
      setTimeout(() => setStep((s) => s + 1), 1500)
    } else {
      setTimeout(() => setShowDoneNote(true), 600)
    }
  }

  return (
    <div className="card p-4 sm:p-5">
      <div
        className="text-[11px] uppercase tracking-wide mb-3"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        Уточняющие вопросы
      </div>

      <ul className="grid gap-3">
        {QUESTIONS.slice(0, step + 1).map((q, i) => {
          const isCurrent = i === step
          const isAnswered = !!answers[q.key]
          return (
            <li
              key={q.key}
              className="animate-fade-in"
              style={{
                opacity: isAnswered && !isCurrent ? 0.5 : 1,
                transition: 'opacity 200ms ease',
              }}
            >
              <div className="text-[13px] mb-2" style={{ fontWeight: 500 }}>
                {q.title}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {q.options.map((opt) => {
                  const selected = answers[q.key] === opt
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => pick(q, opt)}
                      className="px-3 text-[12px] rounded-full transition-colors"
                      style={{
                        height: '32px',
                        background: selected
                          ? 'var(--color-primary)'
                          : 'var(--color-background-tertiary)',
                        color: selected ? '#fff' : 'var(--color-text-secondary)',
                        border: '0.5px solid transparent',
                        fontWeight: selected ? 500 : 400,
                        cursor: isAnswered ? 'default' : 'pointer',
                      }}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </li>
          )
        })}
      </ul>

      {showDoneNote && (
        <div
          className="mt-3 text-[12px] animate-fade-in"
          style={{ color: 'var(--color-success)' }}
        >
          {QUESTIONS[QUESTIONS.length - 1].doneNote}
        </div>
      )}
    </div>
  )
}
