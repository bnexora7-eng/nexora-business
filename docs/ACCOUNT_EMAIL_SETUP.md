# NEXORA account email delivery

Account registration requires email verification. Verification links are single-use and expire after 24 hours. Password-reset links are single-use and expire after one hour; a password reset revokes every active session for that account.

## Recommended provider for the current Render deployment: Brevo API

The NEXORA API currently runs as a **Free Render web service**. Render blocks outbound SMTP traffic on ports 465 and 587 for Free web services, so Gmail SMTP on port 465 will not work from this deployment. The API already supports Brevo's HTTPS API, which uses outbound HTTPS rather than SMTP.

Before enabling live account registration:

1. Create/verify a sender identity in Brevo. The sender address must be verified by Brevo; do not assume the Gmail mailbox can be used until Brevo confirms it.
2. Create a Brevo API key. Keep it private.
3. In Render Dashboard → `nexora-payment-integrity-api` → Environment, add these server-side variables:

| Variable | Value |
|---|---|
| `BREVO_API_KEY` | The private Brevo API key |
| `BREVO_FROM` | The verified sender email address in Brevo |
| `NEXORA_ACCOUNT_URL` | `https://bnexora7-eng.github.io/nexora-business/account` |

4. Save and redeploy the API. Do not paste the API key into chat, GitHub, website JavaScript, mobile app, or screenshots.
5. Verify delivery by registering with an email address you control, then confirm the message arrives and the link opens the NEXORA verification page. Also test password reset.

The code gives Brevo precedence when `BREVO_API_KEY` is configured. Gmail SMTP variables remain available for a future paid host or another environment that permits SMTP; they are not the recommended transport for the current Free Render service.

## Gmail SMTP (not usable on the current Free Render web service)

For a future host that permits outbound SMTP, the API supports Gmail SMTP with a Google App Password:

| Variable | Value |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | NEXORA mailbox address |
| `SMTP_APP_PASSWORD` | Google App Password, never the normal Gmail password |
| `SMTP_FROM` | Verified sender identity |

Never weaken Google account security if App Passwords are unavailable.

## Database and deployment

The API startup executes `src/schema.sql` and logs `NEXORA database schema is ready` when database initialization succeeds. Database migrations must be reviewed and backed up before deployment. The current Free Render Postgres instance has no backups and expires on 12 December 2026; follow `docs/POSTGRESQL_BACKUP_AND_MIGRATION.md` before relying on it for production data.

## Endpoints

- `POST /v1/auth/register` — creates a pending account and sends a 24-hour verification link; does not issue a session.
- `POST /v1/auth/verify-email` — consumes the one-use verification token.
- `POST /v1/auth/resend-verification` — sends a replacement link for a pending account.
- `POST /v1/auth/login` — refuses unverified accounts.
- `POST /v1/auth/request-password-reset` — returns a non-enumerating response and sends a one-hour reset link when eligible.
- `POST /v1/auth/reset-password` — changes the password and revokes active sessions.
- `GET /v1/auth/me` and authenticated feature routes — require a verified account.

The public account pages are `account/verify.html`, `account/forgot-password.html`, and `account/reset-password.html`.