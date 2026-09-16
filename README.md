# Suhanur Rahman Blog CMS

A self-hosted-style editorial CMS built with Next.js, vinext and Cloudflare Workers. Production data lives in Cloudflare D1; media files live in R2.

## Runtime

- Next.js 16 / React 19
- vinext + Cloudflare Workers
- D1 for posts, categories, tags and comments
- R2 for image media

## Cloudflare setup

1. Create a D1 database named `suhanur-blog`.
2. Create an R2 bucket named `suhanur-blog-media`.
3. Put the D1 database ID into `wrangler.toml`.
4. Configure the admin secrets `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` for the Worker.
5. Apply the migration with `npx wrangler d1 migrations apply suhanur-blog --remote`.
6. Connect `blog.suhanurrahman.com` as the custom Worker domain.

### GitHub Actions deployment

The repository includes `.github/workflows/deploy.yml`. After the Cloudflare resources are created, add these GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

Every push to `main` will then apply pending D1 migrations and deploy the vinext Worker. When the admin secrets are present in GitHub, they are re-applied to the Worker after deployment.

## Local

Copy `.dev.vars.example` to `.dev.vars` and set the two admin secrets. Use the vinext development workflow for the Cloudflare runtime.

## CMS

`/admin/` is the private publishing portal. It supports posts, drafts, publishing, categories, tags, media upload and comment moderation.

Post content is authored in Markdown. Published articles are rendered as semantic HTML with `BlogPosting` metadata, canonical URLs and dynamic sitemap entries.

## WordPress migration

The one-time migration workflow exports WordPress content from the legacy origin, merges unpublished/special records from the database snapshot, imports all accessible uploads into R2 with authenticated Wrangler access, builds a foreign-key-safe D1 import, and verifies the resulting counts. The workflow is guarded by the `MIGRATE-WORDPRESS-ONCE` commit message and remains manually dispatchable.
