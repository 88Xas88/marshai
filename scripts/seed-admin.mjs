// Создание первого админ-пользователя для админки блога.
//
// Запуск (локально через .env.local):
//   npm run db:seed-admin -- <login> <password> [<display_name>]
//   ИЛИ
//   node --env-file=.env.local scripts/seed-admin.mjs <login> <password> [<display_name>]
//
// На сервере (env берётся из shared/.env.production):
//   ssh fridgeai-wg "export \$(grep -v '^#' /var/www/marshai/shared/.env.production | xargs) && \
//                    node /var/www/marshai/current/scripts/seed-admin.mjs <login> <password>"
//
// Идемпотентный: если login уже существует — обновит пароль и display_name
// (на тот случай если забыл/потерял пароль).

import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

const [, , login, password, displayName] = process.argv

if (!login || !password) {
  console.error('Usage: node seed-admin.mjs <login> <password> [<display_name>]')
  process.exit(1)
}
if (password.length < 8) {
  console.error('Password must be ≥ 8 characters')
  process.exit(1)
}

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}
const sql = neon(url)

const hash = await bcrypt.hash(password, 10)
console.log('hashing password (bcrypt 10 rounds)... ✓')

const rows = await sql`
  INSERT INTO admin_users (login, password_hash, display_name)
  VALUES (${login}, ${hash}, ${displayName ?? null})
  ON CONFLICT (login) DO UPDATE
    SET password_hash = EXCLUDED.password_hash,
        display_name  = COALESCE(EXCLUDED.display_name, admin_users.display_name)
  RETURNING id::text, login, display_name, created_at::text
`

const r = rows[0]
console.log('\n✓ admin user upserted:')
console.log(`  id:           ${r.id}`)
console.log(`  login:        ${r.login}`)
console.log(`  display_name: ${r.display_name ?? '(null)'}`)
console.log(`  created_at:   ${r.created_at}`)
console.log(`\nЗайти на /admin/login и ввести login=${r.login} + пароль.`)
