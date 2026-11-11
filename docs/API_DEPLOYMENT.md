# NEXORA Payment Integrity API — sandbox deployment

This deployment is for a non-production technical demonstration only.

## Architecture
- API: Render free Docker web service, defined by the repository-root `render.yaml`.
- Database: Neon Free PostgreSQL in the Frankfurt region.
- Browser demo: GitHub Pages.
- Public browser endpoint: `POST /v1/demo/events`, enabled only for the configured GitHub Pages origin and limited to 20 requests per source IP per minute.
- Signed provider endpoint: `POST /v1/events`, using HMAC-SHA256 and a provider-specific secret.

## 1. Create the database
1. Create a project in Neon: https://neon.tech/
2. Select the Frankfurt region if available.
3. Create/open the default database and copy its pooled or direct connection string.
4. Keep the connection string private. It contains database credentials.

## 2. Deploy the API
1. Open the Render Blueprint flow: https://render.com/blueprints
2. Connect the GitHub repository `bnexora7-eng/nexora-business`.
3. Select the repository blueprint. Confirm the API web service plan is **Free** before creating it.
4. Set `DATABASE_URL` to the Neon connection string. Preserve the SSL requirement supplied by Neon.
5. Set `PROVIDER_SECRETS` to JSON containing a newly generated long random secret, for example:
   `{"demo-provider":"REPLACE_WITH_A_LONG_RANDOM_SECRET"}`
6. Confirm `PGSSL=true`, `ENABLE_PUBLIC_DEMO=true`, and `DEMO_ORIGIN=https://bnexora7-eng.github.io`.
7. Deploy. The API applies the idempotent SQL schema at startup.

Do not commit database URLs or provider secrets to GitHub, the browser demo, or screenshots.

## 3. Verify the service
After Render reports a successful deployment, open:
- `https://YOUR-RENDER-SERVICE.onrender.com/health`

Expected response:
`{"status":"ok","service":"nexora-payment-integrity-api"}`

Then set `window.NEXORA_API_BASE_URL` in `payment-integrity-demo/config.js` to the Render service origin (no trailing slash), commit the change, and wait for GitHub Pages to deploy.

## Free-tier limitations
Render free web services can sleep after 15 minutes without traffic and may take about a minute to wake. Render's free PostgreSQL databases expire after 30 days, so this plan uses Neon Free for the database instead. Neon Free currently has usage/storage quotas and can suspend compute when quotas are exhausted. These free services are suitable for a limited prototype demonstration, not production payment workloads.

## Security and product scope
The public demo endpoint is intentionally separate from the signed provider webhook endpoint. It accepts simulated event fields only, has a small in-memory per-IP rate limit, and is not a production-grade abuse-prevention system. Do not submit real payment, customer, bank, or personal data. The API is not a payment processor, bank integration, certified fraud system, or production financial control.
