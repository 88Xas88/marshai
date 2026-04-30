// Двухэтапная генерация SEO-статьи для блога Marshai.
//
// 1) Sonnet получает тему → возвращает JSON-структуру (title/slug/keywords/h2_sections/seo_focus).
// 2) Haiku получает структуру → пишет полное тело статьи в Markdown по этому каркасу.
// 3) Сохраняем в content/blog/<slug>.md с frontmatter (title/slug/description/keywords/publishedAt).
//
// Запуск:
//   ANTHROPIC_API_KEY=... node scripts/generate-blog.mjs "Тема статьи"
//   ANTHROPIC_API_KEY=... node scripts/generate-blog.mjs --batch
//
// --batch — генерирует все темы из массива TOPICS ниже.
// Скрипт пропускает темы для которых slug уже существует в content/blog/.

import { writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const POSTS_DIR = join(__dirname, '..', 'content', 'blog')
mkdirSync(POSTS_DIR, { recursive: true })

const KEY = process.env.ANTHROPIC_API_KEY
if (!KEY) {
  console.error('ANTHROPIC_API_KEY env var required')
  process.exit(1)
}

// Тот же proxy что использует приложение в проде.
const GATEWAY =
  process.env.ANTHROPIC_BASE_URL ??
  'https://gateway.ai.cloudflare.com/v1/00c114e64e1b96d4ebef2716260184f2/marshai-anthropic/anthropic'

const MODEL_OUTLINE = 'claude-sonnet-4-20250514'
const MODEL_BODY = 'claude-haiku-4-5-20251001'

const TOPICS = [
  'Как спланировать поездку в Санкт-Петербург: маршрут на 5 дней',
  'Выходные в Казани: что посмотреть за 3 дня',
  'Поездка в Калининград: маршрут и советы',
  'Сочи в мае: пляж, горы и экскурсии',
  'Владивосток за 4 дня: маршрут с ценами',
  'Как составить бюджет поездки по России',
  'Золотое кольцо на машине: маршрут и цены',
  'Карелия на выходные: озёра и водопады',
  'Екатеринбург за 3 дня: лучшие места',
  'Как сэкономить на путешествии по России',
]

async function callAnthropic(model, system, user, maxTokens) {
  const res = await fetch(`${GATEWAY}/v1/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`HTTP ${res.status}: ${txt.slice(0, 300)}`)
  }
  const data = await res.json()
  const text = data.content?.[0]?.text ?? ''
  return { text, usage: data.usage }
}

function stripJsonFence(text) {
  let t = text.trim()
  if (t.startsWith('```')) t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  return t.trim()
}

// === ЭТАП 1: Sonnet → SEO-каркас ===

const OUTLINE_SYSTEM = `Ты — SEO-стратег для туристического блога Marshai (marshai.ru, AI-планировщик путешествий по России).

Твоя задача: получив тему статьи, вернуть JSON со структурой будущей статьи. Тематика — путешествия по России для русскоязычной аудитории.

Требования к структуре:
- title: финальный H1, до 70 символов, содержит главный keyword.
- slug: URL-сегмент латиницей, через дефисы, без транслита (используй короткие осмысленные слова: "spb-5-days", "kazan-weekend"). Только [a-z0-9-], 30-60 символов.
- description: meta-description, 150-180 символов, заканчивается призывом или интригой.
- keywords: массив из 5-8 ключевых фраз для SEO (RU low-mid конкуренция, реалистичные).
- h2_sections: массив 6-9 заголовков H2 в логичном порядке. Каждый H2 — 4-9 слов, без точки в конце. Включают: введение/контекст, конкретные дни/места/советы, FAQ-секцию в конце.
- seo_focus: одно предложение — какой главный поисковый интент закрывает статья.

Возвращай СТРОГО валидный JSON без markdown-обрамления, без комментариев.`

async function generateOutline(topic) {
  console.log(`  ▸ outline (Sonnet)...`)
  const { text, usage } = await callAnthropic(
    MODEL_OUTLINE,
    OUTLINE_SYSTEM,
    `Тема статьи: "${topic}". Верни JSON-структуру.`,
    800
  )
  const outline = JSON.parse(stripJsonFence(text))
  console.log(`    in=${usage.input_tokens} out=${usage.output_tokens}, slug="${outline.slug}", h2=${outline.h2_sections.length}`)
  return outline
}

// === ЭТАП 2: Haiku → тело Markdown ===

const BODY_SYSTEM = `Ты — копирайтер блога Marshai о путешествиях по России. Получаешь структуру статьи (title + h2_sections + seo_focus) и пишешь её полное тело в чистом Markdown.

Правила:
- Под каждым H2 — 2-4 абзаца текста + при необходимости список или мини-таблица.
- Стиль: дружелюбный, информативный, без воды и канцеляризма. Обращайся к читателю на «ты».
- Длина итоговой статьи: 1500-2500 слов на русском языке.
- Реальные общеизвестные локации: Эрмитаж, Казанский Кремль, Олимпийский парк и т.д. — можно называть.
- Цены и расстояния — приблизительные, формулируй как «ориентировочно 3 000 ₽», «около 200 км».
- НЕ выдумывай конкретные имена ресторанов, кафе, мини-отелей. Используй обобщения: «кафе с татарской кухней в районе Кремля», «семейный ресторан на набережной».
- НЕ пиши «как опытный путешественник я», «дорогие читатели» и подобный шаблонный треш.
- Не используй markdown-таблицы для длинных списков (они плохо рендерятся на мобайле). Лучше bulleted lists.
- Можешь использовать **bold** для ключевых терминов, ссылки на marshai.ru если уместно.
- Включай конкретные числа: дни, цены, время в дороге, % скидок, рейтинги — без них статья выглядит водянистой.
- В конце статьи добавь H2 «Часто задаваемые вопросы» (если ещё не указан в плане) с 3-5 короткими Q+A.

Верни ТОЛЬКО Markdown-тело (без frontmatter, без H1 в начале — H1 будет добавлен из title отдельно). Начинай прямо с первого абзаца или вводного H2.`

async function generateBody(outline) {
  console.log(`  ▸ body (Haiku)...`)
  const userMsg = `Структура статьи:

Title: ${outline.title}
SEO-focus: ${outline.seo_focus}

H2-секции (по порядку):
${outline.h2_sections.map((h, i) => `${i + 1}. ${h}`).join('\n')}

Напиши полное тело статьи в Markdown. Соблюдай порядок H2-секций строго.`

  // 8000 токенов = ~4500-5500 слов на русском, с запасом для FAQ-секции.
  // Haiku 4.5 поддерживает до 64k output, цена на эти доп. токены — копейки.
  const { text, usage } = await callAnthropic(MODEL_BODY, BODY_SYSTEM, userMsg, 8000)
  const truncated = text.length < 200 || !text.trim().match(/[.!?»"]\s*$/)
  console.log(
    `    in=${usage.input_tokens} out=${usage.output_tokens} chars=${text.length}${truncated ? ' ⚠ возможно обрезано' : ''}`
  )
  return text.trim()
}

// === Сохранение ===

function buildMarkdown(outline, body, today) {
  const fm = [
    '---',
    `title: ${JSON.stringify(outline.title)}`,
    `slug: ${JSON.stringify(outline.slug)}`,
    `description: ${JSON.stringify(outline.description)}`,
    `keywords: ${JSON.stringify(outline.keywords)}`,
    `publishedAt: "${today}"`,
    '---',
    '',
    body,
    '',
  ].join('\n')
  return fm
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

async function generateOne(topic) {
  console.log(`\n━━━ ${topic} ━━━`)
  const outline = await generateOutline(topic)
  // Доп. защита: если slug уже использован — пропускаем (idempotent batch).
  const dest = join(POSTS_DIR, `${outline.slug}.md`)
  if (existsSync(dest)) {
    console.log(`  ⊘ ${outline.slug}.md уже существует — пропуск`)
    return { skipped: true }
  }
  const body = await generateBody(outline)
  const md = buildMarkdown(outline, body, todayIso())
  writeFileSync(dest, md, 'utf8')
  console.log(`  ✓ saved: content/blog/${outline.slug}.md (${md.length}b)`)
  return { skipped: false, slug: outline.slug }
}

async function main() {
  const args = process.argv.slice(2)
  const isBatch = args.includes('--batch')

  if (isBatch) {
    console.log(`Batch mode: ${TOPICS.length} тем\n`)
    let made = 0
    let skipped = 0
    for (const topic of TOPICS) {
      try {
        const r = await generateOne(topic)
        r.skipped ? skipped++ : made++
      } catch (e) {
        console.error(`  ✖ ${topic}: ${e.message}`)
      }
    }
    console.log(`\n═══ done: made=${made}, skipped=${skipped} ═══`)
    console.log(`файлы: ${readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md')).join(', ')}`)
    return
  }

  const topic = args.join(' ').trim()
  if (!topic) {
    console.error('usage: node generate-blog.mjs "<тема>" | --batch')
    process.exit(1)
  }
  await generateOne(topic)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
