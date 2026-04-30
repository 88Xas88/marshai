// Прямой тест prompt caching через CF AI Gateway.
// Читает STATIC_PROMPT из lib/claude.ts чтобы не разъезжалось.
// Запуск (на сервере с ключом):
//   ssh fridgeai-wg 'export ANTHROPIC_API_KEY=...; node /tmp/test-cache.mjs'

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const KEY = process.env.ANTHROPIC_API_KEY
if (!KEY) { console.error('ANTHROPIC_API_KEY required'); process.exit(1) }

const MODEL = 'claude-haiku-4-5-20251001'
const GATEWAY = 'https://gateway.ai.cloudflare.com/v1/00c114e64e1b96d4ebef2716260184f2/marshai-anthropic/anthropic/v1/messages'

// Извлекаем STATIC_PROMPT из lib/claude.ts грубым парсингом.
const __dirname = dirname(fileURLToPath(import.meta.url))
const claudeSrc = readFileSync(join(__dirname, '..', 'lib', 'claude.ts'), 'utf8')
const start = claudeSrc.indexOf('const STATIC_PROMPT = `')
const end = claudeSrc.indexOf('`\n\nfunction buildDynamicSection')
if (start < 0 || end < 0) {
  console.error('failed to extract STATIC_PROMPT')
  process.exit(1)
}
const STATIC_PROMPT = claudeSrc
  .slice(start + 'const STATIC_PROMPT = `'.length, end)
  // снимаем экранирование backticks из source
  .replace(/\\`/g, '`')

console.log(`STATIC_PROMPT: ${STATIC_PROMPT.length} chars`)
console.log('')

const ROUTES = [
  'Параметры: Москва → Казань, 4 дня, 15 000 ₽, музеи. Дай JSON-план.',
  'Параметры: Москва → Сочи, 5 дней, 30 000 ₽, прогулки. Дай JSON-план.',
  'Параметры: Москва → Калининград, 3 дня, 20 000 ₽, food. Дай JSON-план.',
]

async function call(dynamicText, label) {
  const start = Date.now()
  const res = await fetch(GATEWAY, {
    method: 'POST',
    headers: {
      'x-api-key': KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: STATIC_PROMPT, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: dynamicText },
        ],
      }],
    }),
  })
  const ms = Date.now() - start
  const data = await res.json()
  if (!res.ok) {
    console.log(`✖ ${label} HTTP ${res.status}: ${JSON.stringify(data).slice(0, 300)}`)
    return null
  }
  const u = data.usage
  console.log(`${label}  | ${(ms/1000).toFixed(1)}s | in=${u.input_tokens} out=${u.output_tokens} cache_w=${u.cache_creation_input_tokens} cache_r=${u.cache_read_input_tokens}`)
  return u
}

let totalRegular = 0
let totalCacheW = 0
let totalCacheR = 0
let totalOut = 0

for (let i = 0; i < ROUTES.length; i++) {
  const u = await call(ROUTES[i], `call ${i+1}`)
  if (!u) continue
  totalRegular += u.input_tokens
  totalCacheW += u.cache_creation_input_tokens
  totalCacheR += u.cache_read_input_tokens
  totalOut += u.output_tokens
}

console.log('')
console.log('=== итоговая стоимость 3 запросов ===')
// Haiku 4.5: in $1/M, cache_w $1.25/M, cache_r $0.10/M, out $5/M
const newCost =
  (totalRegular * 1) / 1e6 +
  (totalCacheW * 1.25) / 1e6 +
  (totalCacheR * 0.1) / 1e6 +
  (totalOut * 5) / 1e6
const oldCost =
  ((totalRegular + totalCacheW + totalCacheR) * 1) / 1e6 +
  (totalOut * 5) / 1e6
console.log(`без кеша:  $${oldCost.toFixed(5)} = ${(oldCost * 85).toFixed(3)} ₽`)
console.log(`с кешем:   $${newCost.toFixed(5)} = ${(newCost * 85).toFixed(3)} ₽`)
const saving = ((oldCost - newCost) / oldCost) * 100
console.log(`экономия:  ${saving.toFixed(1)}%`)
