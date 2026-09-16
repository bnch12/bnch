import fs from 'node:fs/promises'

// Remove only records owned by the WordPress migration. Content created later
// through the CMS uses different IDs and is intentionally preserved.
const sql = [
  "DELETE FROM comments WHERE id LIKE 'wp-comment-%';",
  "DELETE FROM posts WHERE id LIKE 'wp-%';",
  "DELETE FROM categories WHERE id LIKE 'wp-cat-%';",
  "DELETE FROM tags WHERE id LIKE 'wp-tag-%';",
  "DELETE FROM categories WHERE id LIKE 'cat-%';",
].join('\n') + '\n'

await fs.mkdir('migration-data', { recursive: true })
await fs.writeFile('migration-data/cleanup.sql', sql)
console.log('Generated clean WordPress migration SQL.')
