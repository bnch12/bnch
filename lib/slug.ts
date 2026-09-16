export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^\p{Letter}\p{Number}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 180) || `post-${Date.now()}`
}
