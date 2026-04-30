import { AwsClient } from 'aws4fetch'

// Cloudflare R2 — S3-совместимое хранилище. Работает через подписанные fetch'и
// с aws4fetch (5 KB) — не таскаем тяжёлый @aws-sdk/client-s3.
//
// Нужны env переменные:
//   R2_ACCOUNT_ID         — Cloudflare account ID
//   R2_ACCESS_KEY_ID      — R2 API token Access Key
//   R2_SECRET_ACCESS_KEY  — R2 API token Secret
//   R2_BUCKET_NAME        — название бакета (например marshai-blog)
//   R2_PUBLIC_URL         — публичный CDN-URL бакета (например https://pub-xyz.r2.dev
//                           или собственный домен blog-cdn.marshai.ru)

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const SECRET = process.env.R2_SECRET_ACCESS_KEY
const BUCKET = process.env.R2_BUCKET_NAME
const PUBLIC_URL = process.env.R2_PUBLIC_URL

export const r2Configured =
  !!ACCOUNT_ID && !!ACCESS_KEY_ID && !!SECRET && !!BUCKET && !!PUBLIC_URL

const client =
  ACCESS_KEY_ID && SECRET
    ? new AwsClient({
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET,
        service: 's3',
        region: 'auto',
      })
    : null

interface UploadResult {
  ok: boolean
  url?: string
  error?: string
}

function safeFilename(name: string): string {
  // Сохраняем только латиницу/цифры/дефис, остальное → дефис.
  // Базовое имя без расширения. Расширение должно прийти отдельно из contentType.
  const base = name.replace(/\.[^.]+$/, '')
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'image'
}

function extFromContentType(ct: string): string {
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg'
  if (ct.includes('png')) return 'png'
  if (ct.includes('webp')) return 'webp'
  if (ct.includes('gif')) return 'gif'
  if (ct.includes('avif')) return 'avif'
  if (ct.includes('svg')) return 'svg'
  return 'bin'
}

export async function uploadImage(
  body: ArrayBuffer | Uint8Array | Buffer,
  contentType: string,
  originalName?: string
): Promise<UploadResult> {
  if (!client || !r2Configured) {
    return { ok: false, error: 'R2 is not configured (missing env vars)' }
  }

  const ext = extFromContentType(contentType)
  const slug = safeFilename(originalName ?? 'image')
  // Префикс blog/ — чтобы все блоговые картинки лежали в одном «папке» (R2 их
  // не различает структурно, но удобно для глаз/политик доступа).
  const key = `blog/${Date.now()}-${slug}.${ext}`

  const endpoint = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com/${BUCKET}/${key}`

  try {
    const res = await client.fetch(endpoint, {
      method: 'PUT',
      body: body as BodyInit,
      headers: {
        'Content-Type': contentType,
      },
    })
    if (!res.ok) {
      const txt = await res.text()
      return { ok: false, error: `R2 PUT ${res.status}: ${txt.slice(0, 200)}` }
    }
    const publicBase = (PUBLIC_URL ?? '').replace(/\/$/, '')
    return { ok: true, url: `${publicBase}/${key}` }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}
