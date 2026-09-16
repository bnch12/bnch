import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const D1_NAME = process.env.D1_DATABASE_NAME || 'banglachoti24-new-blog'
const R2_NAME = process.env.R2_BUCKET_NAME || 'banglachoti24-new-blog-media'
const CONFIG = process.env.WRANGLER_CONFIG || 'wrangler.toml'

function wrangler(args) {
  return execFileSync('npx', ['wrangler', ...args], {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'inherit'],
  }).trim()
}

function findUuid(value) {
  if (!value || typeof value !== 'object') return null
  if (typeof value.uuid === 'string') return value.uuid
  for (const child of Object.values(value)) {
    const found = findUuid(child)
    if (found) return found
  }
  return null
}

let d1Id = null
try {
  const info = wrangler(['d1', 'info', D1_NAME, '--json'])
  d1Id = findUuid(JSON.parse(info))
} catch {
  // Database may not exist yet; create it below.
}

if (!d1Id) {
  wrangler(['d1', 'create', D1_NAME, '--location=apac'])
  const info = wrangler(['d1', 'info', D1_NAME, '--json'])
  d1Id = findUuid(JSON.parse(info))
}

if (!d1Id) throw new Error(`Could not resolve D1 UUID for ${D1_NAME}`)

try {
  wrangler(['r2', 'bucket', 'create', R2_NAME, '--location=apac'])
} catch {
  // An existing bucket returns an error; the stable bucket name is still valid.
}

let config = readFileSync(CONFIG, 'utf8')
config = config.replace(/\n\[\[d1_databases\]\][\s\S]*?(?=\n\[\[|\n\[vars\]|\n\[secrets\]|$)/g, '')
config = config.replace(/\n\[\[r2_buckets\]\][\s\S]*?(?=\n\[\[|\n\[vars\]|\n\[secrets\]|$)/g, '')

if (!config.endsWith('\n')) config += '\n'
config += `\n[[d1_databases]]\nbinding = "BLOG_DB"\ndatabase_name = "${D1_NAME}"\ndatabase_id = "${d1Id}"\nmigrations_dir = "migrations"\n\n[[r2_buckets]]\nbinding = "BLOG_MEDIA"\nbucket_name = "${R2_NAME}"\n`

writeFileSync(CONFIG, config)
console.log(`Configured ${CONFIG}: D1=${D1_NAME} (${d1Id}), R2=${R2_NAME}`)
