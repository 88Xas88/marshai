// Server-only часть admin-аутентификации: bcrypt + DB-доступ. Импортируйте
// ТОЛЬКО из API-роутов с runtime='nodejs'. В middleware (edge) использовать
// lib/admin-auth.ts (JWT-only, без bcrypt).

import bcrypt from 'bcryptjs'
import { neon } from '@neondatabase/serverless'

export interface AdminUser {
  id: string
  login: string
  displayName: string | null
}

const dbUrl = process.env.DATABASE_URL
const sql = dbUrl ? neon(dbUrl) : null

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyAdminCredentials(
  login: string,
  password: string
): Promise<AdminUser | null> {
  if (!sql) return null
  try {
    const rows = (await sql`
      SELECT id::text, login, password_hash, display_name
      FROM admin_users
      WHERE login = ${login}
      LIMIT 1
    `) as { id: string; login: string; password_hash: string; display_name: string | null }[]
    const row = rows[0]
    if (!row) return null
    const ok = await bcrypt.compare(password, row.password_hash)
    if (!ok) return null
    sql`UPDATE admin_users SET last_login = NOW() WHERE id::text = ${row.id}`.catch(
      () => {}
    )
    return { id: row.id, login: row.login, displayName: row.display_name }
  } catch (err) {
    console.error('[admin-auth-server] verifyAdminCredentials failed:', err)
    return null
  }
}
