$ErrorActionPreference = 'Stop'

Write-Host 'Checking Cloudflare authentication...' -ForegroundColor Cyan
npx wrangler whoami

Write-Host 'Provisioning D1/R2 and writing live bindings...' -ForegroundColor Cyan
node .\scripts\ensure-cloudflare-resources.mjs

Write-Host 'Applying D1 migrations...' -ForegroundColor Cyan
npx wrangler d1 migrations apply banglachoti24-new-blog --remote

Write-Host 'Set production ADMIN_PASSWORD:' -ForegroundColor Yellow
npx wrangler secret put ADMIN_PASSWORD

Write-Host 'Set production ADMIN_SESSION_SECRET:' -ForegroundColor Yellow
npx wrangler secret put ADMIN_SESSION_SECRET

Write-Host 'Deploying Worker and custom domain new.banglachoti24.com...' -ForegroundColor Cyan
npx @vinext/cloudflare deploy

Write-Host 'Done: https://new.banglachoti24.com' -ForegroundColor Green
