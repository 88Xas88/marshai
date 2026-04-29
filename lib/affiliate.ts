export function buildAffiliateUrl(url: string): string {
  const marker = process.env.TRAVELPAYOUTS_MARKER
  if (!marker) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}marker=${encodeURIComponent(marker)}`
}
