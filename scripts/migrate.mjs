// Запуск:  node --env-file=.env.local scripts/migrate.mjs
// Применяет все *.sql из ./migrations в алфавитном порядке.
// Идемпотентно: миграции написаны через CREATE/ALTER ... IF NOT EXISTS.

import { neon } from '@neondatabase/serverless'
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = resolve(__dirname, '..', 'migrations')

function fail(msg) {
  console.error('✖', msg)
  process.exit(1)
}

const url = process.env.DATABASE_URL
if (!url) {
  fail('DATABASE_URL is not set. Run with: node --env-file=.env.local scripts/migrate.mjs')
}

const sql = neon(url)

const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort()

if (files.length === 0) {
  fail(`No .sql files found in ${MIGRATIONS_DIR}`)
}

console.log(`→ Connecting to ${new URL(url).host}`)
console.log(`→ Found ${files.length} migration file(s):`, files)

// Sanity check: подключение работает.
try {
  const ping = await sql`SELECT now() AS ts, current_database() AS db, version() AS v`
  console.log(`✓ Connected. db=${ping[0].db}, time=${ping[0].ts}`)
} catch (err) {
  fail(`Connection failed: ${err.message}`)
}

for (const file of files) {
  const path = join(MIGRATIONS_DIR, file)
  const content = readFileSync(path, 'utf8')
  console.log(`\n→ Applying ${file}...`)

  // 1. Удаляем строки-комментарии `-- ...` (line-level), 2. split по `;`, 3. trim, 4. отбрасываем пустые.
  // Не работает для DDL с dollar-quoted строками или функциями (нам это не нужно).
  const stripped = content
    .split('\n')
    .filter((line) => !/^\s*--/.test(line))
    .join('\n')
  const statements = stripped
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  for (const stmt of statements) {
    const preview = stmt.slice(0, 80).replace(/\s+/g, ' ')
    try {
      await sql.query(stmt)
      console.log(`  ✓ ${preview}${stmt.length > 80 ? '...' : ''}`)
    } catch (err) {
      console.error(`  ✖ Failed: ${preview}`)
      fail(err.message)
    }
  }
}

// Verify tables exist with their columns.
console.log('\n→ Verifying schema...')
const tables = await sql`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('plans', 'price_alerts', 'users', 'auth_tokens')
  ORDER BY table_name
`
console.log('  Tables:', tables.map((t) => t.table_name).join(', '))

const planCols = await sql`
  SELECT column_name, data_type, column_default
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'plans'
  ORDER BY ordinal_position
`
console.log('  plans columns:')
for (const c of planCols) {
  console.log(`    - ${c.column_name} (${c.data_type})${c.column_default ? ` default ${c.column_default}` : ''}`)
}

const alertCols = await sql`
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'price_alerts'
  ORDER BY ordinal_position
`
console.log('  price_alerts columns:')
for (const c of alertCols) {
  console.log(`    - ${c.column_name} (${c.data_type})`)
}

console.log('\n✓ Migration complete.')
