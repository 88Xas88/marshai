import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'
import { verifyAdminJWT, ADMIN_COOKIE } from '@/lib/admin-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const apiKey = process.env.ANTHROPIC_API_KEY
const ANTHROPIC_BASE_URL =
  process.env.ANTHROPIC_BASE_URL ??
  'https://gateway.ai.cloudflare.com/v1/00c114e64e1b96d4ebef2716260184f2/marshai-anthropic/anthropic'

const client = apiKey ? new Anthropic({ apiKey, baseURL: ANTHROPIC_BASE_URL }) : null

const MODEL_OUTLINE = 'claude-sonnet-4-20250514'
const MODEL_BODY = 'claude-haiku-4-5-20251001'

const OUTLINE_SYSTEM = `Ты — SEO-стратег туристического блога Marshai. Получив тему, верни JSON со структурой статьи. Тематика — путешествия по России для русскоязычной аудитории.

Поля:
- title: финальный H1, до 70 символов, содержит главный keyword
- slug: URL-сегмент латиницей через дефис, [a-z0-9-], 30-60 символов
- description: meta-description 150-180 символов
- meta_title: title-tag для search results, до 60 символов (может отличаться от title)
- meta_description: meta-description для SEO, 150-160 символов
- keywords: массив 5-8 ключевых фраз для SEO
- h2_sections: массив 6-9 заголовков H2 в логичном порядке (4-9 слов каждый, без точки)
- image_prompts: массив из 3-5 промптов на английском для генерации иллюстраций (Nano Banana / Midjourney style). Каждый — детальное визуальное описание сцены.

Возвращай СТРОГО JSON без markdown-обрамления.`

const BODY_SYSTEM = `Ты — копирайтер блога Marshai. Получаешь structure и пишешь полное тело в Markdown.

Правила:
- Под каждым H2 — 2-4 абзаца + при нужде список.
- Длина 1500-2500 слов на русском, "ты" к читателю.
- Реальные общеизвестные локации; никогда не выдумывай конкретные имена ресторанов/мини-отелей — пиши обобщения ("кафе в районе Кремля").
- Цены/расстояния как "ориентировочно 3 000 ₽".
- В местах где должна быть иллюстрация — вставляй плейсхолдер вида:
  [IMAGE_PLACEHOLDER: описание промпта для Nano Banana 2 на английском]
  Используй image_prompts из переданной структуры — по одному после первого, среднего и последнего больших H2.
- Завершай статью H2 «Часто задаваемые вопросы» с 3-5 Q+A.
- Никаких code-fence, никакой преамбулы. Только Markdown body, начиная с первого абзаца / H2.`

interface Body {
  topic?: string
}

function stripJsonFence(text: string): string {
  let t = text.trim()
  if (t.startsWith('```')) t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  return t.trim()
}

interface Outline {
  title: string
  slug: string
  description: string
  meta_title?: string
  meta_description?: string
  keywords: string[]
  h2_sections: string[]
  image_prompts?: string[]
}

export async function POST(req: Request) {
  const store = await cookies()
  const session = store.get(ADMIN_COOKIE)?.value
  if (!session || !(await verifyAdminJWT(session))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  if (!client) {
    return NextResponse.json(
      { ok: false, error: 'anthropic_not_configured' },
      { status: 503 }
    )
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }
  const topic = (body.topic ?? '').trim()
  if (!topic) {
    return NextResponse.json({ ok: false, error: 'missing_topic' }, { status: 400 })
  }

  // === ЭТАП 1: Sonnet → outline JSON ===
  let outline: Outline
  try {
    const res = await client.messages.create({
      model: MODEL_OUTLINE,
      max_tokens: 1200,
      system: OUTLINE_SYSTEM,
      messages: [{ role: 'user', content: `Тема статьи: "${topic}". Верни JSON-структуру.` }],
    })
    const text = res.content.find((b) => b.type === 'text')
    if (!text || text.type !== 'text') throw new Error('no text in outline response')
    outline = JSON.parse(stripJsonFence(text.text))
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'outline_failed', detail: String(err).slice(0, 300) },
      { status: 502 }
    )
  }

  // === ЭТАП 2: Haiku → тело Markdown ===
  let bodyMd: string
  try {
    const userMsg = `Структура статьи:

Title: ${outline.title}

H2-секции (по порядку):
${outline.h2_sections.map((h, i) => `${i + 1}. ${h}`).join('\n')}

Промпты для иллюстраций (используй [IMAGE_PLACEHOLDER: ...] в нужных местах):
${(outline.image_prompts ?? []).map((p, i) => `${i + 1}. ${p}`).join('\n') || '(промпты не заданы — обойтись без иллюстраций)'}

Напиши полное тело статьи в Markdown. Соблюдай порядок H2-секций строго.`

    const res = await client.messages.create({
      model: MODEL_BODY,
      max_tokens: 8000,
      system: BODY_SYSTEM,
      messages: [{ role: 'user', content: userMsg }],
    })
    const text = res.content.find((b) => b.type === 'text')
    if (!text || text.type !== 'text') throw new Error('no text in body response')
    bodyMd = text.text.trim()
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'body_failed', detail: String(err).slice(0, 300) },
      { status: 502 }
    )
  }

  // Возвращаем фронту единый объект — он заполнит поля редактора.
  return NextResponse.json({
    ok: true,
    fields: {
      title: outline.title,
      slug: outline.slug,
      description: outline.description,
      meta_title: outline.meta_title ?? outline.title,
      meta_description: outline.meta_description ?? outline.description,
      keywords: outline.keywords ?? [],
      content: bodyMd,
      image_prompts: outline.image_prompts ?? [],
    },
  })
}
