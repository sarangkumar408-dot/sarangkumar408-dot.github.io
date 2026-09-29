# Cloudflare simple deployment

This folder contains the lightest possible Cloudflare migration for the project.

## Files
- `worker.js` — simple Worker API for founder, messages, visits, projects, and news
- `wrangler.toml` — Cloudflare configuration

## Setup
1. Install Wrangler:
   ```bash
   npm install -g wrangler
   ```
2. Log in:
   ```bash
   wrangler login
   ```
3. Create a KV namespace:
   ```bash
   wrangler kv:namespace create APP_KV
   ```
4. Create an R2 bucket:
   ```bash
   wrangler r2 bucket create nexusforge-media
   ```
5. Replace the KV namespace ID in `wrangler.toml`.
6. Deploy:
   ```bash
   wrangler deploy
   ```

## Notes
- Keep the site front-end as-is while switching API calls to the Cloudflare Worker.
- Use `APP_KV` for JSON data and `MEDIA` for uploaded files.
- This is intentionally simple and lightweight for a static portfolio site.
