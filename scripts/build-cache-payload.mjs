import { readFileSync, writeFileSync, statSync } from 'node:fs'

const CLAUDE_TS = process.argv[2] ?? '/tmp/claude.ts'
const OUT_DIR = process.argv[3] ?? '/tmp'

const src = readFileSync(CLAUDE_TS, 'utf8')
const startMarker = 'const STATIC_PROMPT = `'
const endMarker = '`\n\nfunction buildDynamicSection'
const start = src.indexOf(startMarker)
const end = src.indexOf(endMarker)
if (start < 0 || end < 0) {
  console.error('STATIC_PROMPT markers not found in', CLAUDE_TS)
  process.exit(1)
}
const sp = src.slice(start + startMarker.length, end).replace(/\\`/g, '`')
console.error(`STATIC_PROMPT: ${sp.length} chars`)

function makePayload(dynamic) {
  return JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: sp, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: dynamic },
      ],
    }],
  })
}

writeFileSync(`${OUT_DIR}/payload1.json`, makePayload('Параметры: Москва → Казань, 4 дня, 15 000 ₽, музеи. JSON.'))
writeFileSync(`${OUT_DIR}/payload2.json`, makePayload('Параметры: Москва → Сочи, 5 дней, 30 000 ₽, прогулки. JSON.'))
console.error(`payload1: ${statSync(`${OUT_DIR}/payload1.json`).size}b`)
console.error(`payload2: ${statSync(`${OUT_DIR}/payload2.json`).size}b`)
