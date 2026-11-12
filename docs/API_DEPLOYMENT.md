# NEXORA Payment Integrity API — sandbox deployment

This deployment is for a non-production technical demonstration only.

## Architecture
- API: Render free Docker web service, defined by the repository-root `render.yaml`.
- Database: Render PostgreSQL in the Frankfurt region, provisioned by the repository-root `render.yaml` Blueprint.
- Browser demo: GitHub Pages.
- Public browser endpoint: `POST /v1/demo/events`, enabled only for the configured GitHub Pages origin and limited to 20 requests per source IP per minute.
- Signed provider endpoint: `POST /v1/events`, using HMAC-SHA256 and a provider-specific secret.

## 1. Deploy the API
1. Open the Render Blueprint flow: https://render.com/blueprints
2. Connect the GitHub repository `bnexora7-eng/nexora-business`.
3. Select the repository blueprint. Confirm the API web service and PostgreSQL database plans before creating them.
4. The Blueprint wires `DATABASE_URL` to the same-region Render PostgreSQL database. Keep this connection string private.
5. Set `PROVIDER_SECRETS` to JSON containing a newly generated long random secret, for example:
   `{"demo-provider":"REPLACE_WITH_A_LONG_RANDOM_SECRET"}`
6. Keep `PGSSL=false` for the private Render PostgreSQL connection. Set `ENABLE_PUBLIC_DEMO=true` and `DEMO_ORIGIN=https://bnexora7-eng.github.io`.
7. Deploy. The API applies the idempotent SQL schema at startup.

Do not commit database URLs or provider secrets to GitHub, the browser demo, or screenshots.

## 2. Verify the service
After Render reports a successful deployment, open:
- `https://YOUR-RENDER-SERVICE.onrender.com/health` — confirms the API process is responding.
- `https://YOUR-RENDER-SERVICE.onrender.com/ready` — confirms PostgreSQL is configured and reachable.

Expected responses:
- `/health`: HTTP 200 with `{"status":"ok","service":"nexora-payment-integrity-api","mode":"database"}`.
- `/ready`: HTTP 200 with `{"status":"ready","database":"connected"}`.

If `/health` reports `"mode":"demo-only"`, the API is running but the database is not configured. If `/ready` returns HTTP 503, account registration and persistent provider-event processing are not ready. Do not treat an HTTP 200 from `/health` alone as proof that PostgreSQL is connected.

Then set `window.NEXORA_API_BASE_URL` in `payment-integrity-demo/config.js` to the Render service origin (no trailing slash), commit the change, and wait for GitHub Pages to deploy.

## 3. Connect the Android account module
1. In GitHub, open repository Settings → Secrets and variables → Actions → Variables.
2. Add a repository variable named `EXPO_PUBLIC_NEXORA_API_URL` with the Render service origin, for example `https://your-service.onrender.com` (no trailing slash). This URL is public configuration, not a secret.
3. Run the `NEXORA Android release` workflow again. The build embeds this URL so the app can reach `/v1/auth/register`, `/v1/auth/login`, `/v1/auth/me` and `/v1/auth/logout`.
4. Keep database credentials and all provider secrets exclusively in Render environment variables. Never place them in the Android app or GitHub source.

## Free-tier limitations
Render free web services can sleep after 15 minutes without traffic and may take about a minute to wake. Render's free PostgreSQL databases expire after 30 days, so this plan uses Neon Free for the database instead. Neon Free currently has usage/storage quotas and can suspend compute when quotas are exhausted. These free services are suitable for a limited prototype demonstration, not production payment workloads.

## Security and product scope
The public demo endpoint is intentionally separate from the signed provider webhook endpoint. It accepts simulated event fields only, has a small in-memory per-IP rate limit, and is not a production-grade abuse-prevention system. Do not submit real payment, customer, bank, or personal data. The API is not a payment processor, bank integration, certified fraud system, or production financial control.
