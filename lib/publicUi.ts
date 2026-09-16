// Shared helpers for the public magazine UI (usable in both server & client).

const PALETTE = [
  '#e11d2a', '#2563eb', '#0d9488', '#d97706', '#7c3aed',
  '#db2777', '#0891b2', '#16a34a', '#4f46e5', '#c2410c',
]

/** Deterministic accent color for a category name. */
export function catColor(name?: string | null): string {
  const key = (name || '').trim()
  if (!key) return PALETTE[0]
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

export function formatDate(value?: string | null): string {
  if (!value) return ''
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

export function shortText(value?: string | null, max = 160): string {
  const text = (value || '').trim()
  return text.length > max ? `${text.slice(0, max).trim()}…` : text
}
