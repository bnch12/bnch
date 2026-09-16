import fs from 'node:fs/promises'

const mainPath = 'migration-data/wordpress.json'
const supplementPath = 'migration-data/wordpress-supplement.json'

const main = JSON.parse(await fs.readFile(mainPath, 'utf8'))
const supplement = JSON.parse(await fs.readFile(supplementPath, 'utf8'))

const existingPosts = new Map(main.posts.map((post) => [String(post.id), post]))
for (const post of supplement.posts || []) {
  if (!existingPosts.has(String(post.id))) existingPosts.set(String(post.id), post)
}

const existingComments = new Map(main.comments.map((comment) => [String(comment.id), comment]))
for (const comment of supplement.comments || []) {
  // Pingbacks are WordPress metadata, not reader comments.
  if (comment.type && comment.type !== 'comment') continue
  if (!existingComments.has(String(comment.id))) existingComments.set(String(comment.id), comment)
}

main.posts = [...existingPosts.values()]
main.comments = [...existingComments.values()]
main.mergedSupplement = true
await fs.writeFile(mainPath, JSON.stringify(main, null, 2))

console.log(`Merged WordPress snapshot: ${main.posts.length} posts and ${main.comments.length} comments.`)
