import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { neon } from '@neondatabase/serverless'

const SECRET_RAW = process.env.AUTH_SECRET
const SECRET = SECRET_RAW ? new TextEncoder().encode(SECRET_RAW) : null

export const ADMIN_COOKIE = 'marshai_admin_session'
export const ADMIN_SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60 // 7 дней

export interface AdminSessionPayload {
  adminId: string
  login: string
}

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
    // Обновляем last_login (best-effort).
    sql`UPDATE admin_users SET last_login = NOW() WHERE id::text = ${row.id}`.catch(
      () => {}
    )
    return { id: row.id, login: row.login, displayName: row.display_name }
  } catch (err) {
    console.error('[admin-auth] verifyAdminCredentials failed:', err)
    return null
  }
}

export async function signAdminJWT(payload: AdminSessionPayload): Promise<string> {
  if (!SECRET) throw new Error('AUTH_SECRET is not configured')
  return new SignJWT({ adminId: payload.adminId, login: payload.login })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifyAdminJWT(
  token: string
): Promise<AdminSessionPayload | null> {
  if (!SECRET) return null
  try {
    const { payload } = await jwtVerify(token, SECRET)
    if (typeof payload.adminId !== 'string' || typeof payload.login !== 'string') {
      return null
    }
    return { adminId: payload.adminId, login: payload.login }
  } catch {
    return null
  }
}
