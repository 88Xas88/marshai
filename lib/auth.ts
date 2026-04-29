import { SignJWT, jwtVerify } from 'jose'

const SECRET_RAW = process.env.AUTH_SECRET
const SECRET = SECRET_RAW ? new TextEncoder().encode(SECRET_RAW) : null

export const SESSION_COOKIE = 'marshai_session'
export const SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60

export interface SessionPayload {
  email: string
  userId: string
}

export async function signJWT(payload: SessionPayload): Promise<string> {
  if (!SECRET) {
    throw new Error('AUTH_SECRET is not configured')
  }
  return new SignJWT({ email: payload.email, userId: payload.userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET)
}

export async function verifyJWT(token: string): Promise<SessionPayload | null> {
  if (!SECRET) return null
  try {
    const { payload } = await jwtVerify(token, SECRET)
    if (typeof payload.email !== 'string' || typeof payload.userId !== 'string') {
      return null
    }
    return { email: payload.email, userId: payload.userId }
  } catch {
    return null
  }
}

export const authEnabled = !!SECRET
