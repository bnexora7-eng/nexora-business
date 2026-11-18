# ALPINOSS account email delivery

Account registration requires email verification. Verification links are single-use and expire after 24 hours. Password-reset links are single-use and expire after one hour; a password reset revokes every active session for that account.

## Preferred provider: Resend HTTPS API

The ALPINOSS API runs on Render Free. The application now prefers Resend over Brevo whenever `RESEND_API_KEY` is present. Resend uses HTTPS and does not require outbound SMTP ports.

### What is already implemented

- Resend API integration at `POST https://api.resend.com/emails`.
- Existing ALPINOSS verification and password-reset templates are reused.
- API credentials remain server-side.
- Provider errors are sanitized before they reach application callers.
- Automated tests cover the Resend request and the safety guard for the test sender.
- Brevo remains as a temporary fallback for rollback; it is not required when Resend is configured.

### What is still required for real customer email

The repository currently uses GitHub Pages at `bnexora7-eng.github.io`; the project records do not identify a separately owned ALPINOSS domain. Resend's `onboarding@resend.dev` sender is restricted to testing and cannot send verification/reset emails to arbitrary customers. To send to ALPINOSS users, a domain controlled by the owner must be added and verified in Resend, with the exact DNS records Resend provides.

Do not invent a domain or DNS records. Do not use the Gmail contact address as a sender domain.

### Render environment variables

In Render Dashboard → `nexora-payment-integrity-api` → Environment, add:

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | Private Resend API key; enter directly in Render |
| `RESEND_FROM` | Sender address on the verified domain, e.g. `ALPINOSS <no-reply@your-verified-domain>` |

Keep `RESEND_ALLOW_TEST_SENDER=false` (or unset) for production. Do not set `RESEND_FROM=onboarding@resend.dev` for public registration. The API deliberately fails closed if the test sender is selected without explicit test override.

The API will use Resend whenever `RESEND_API_KEY` exists. If it is absent, the legacy Brevo configuration may still be used. Remove the old Brevo variables only after Resend delivery has been verified; no secret should be copied into GitHub, chat, email, browser JavaScript or screenshots.

### Safe rollout and verification

1. Create a Resend account and verify an owner-controlled sending domain.
2. Create a sending-only API key.
3. Enter `RESEND_API_KEY` and `RESEND_FROM` directly in Render.
4. Save and wait for the automatic deployment.
5. Register a test account using an email address controlled by the owner.
6. Confirm the verification email arrives and its one-time link activates the account.
7. Test password reset and confirm the one-time link works.
8. Only after both live tests pass, remove legacy Brevo secrets from Render.

Do not enable live payments or claim production readiness as part of this email-provider change.

## Account endpoints

- `POST /v1/auth/register` — creates a pending account and sends a 24-hour verification link; does not issue a session.
- `POST /v1/auth/verify-email` — consumes the one-use verification token.
- `POST /v1/auth/resend-verification` — sends a replacement link for a pending account.
- `POST /v1/auth/login` — refuses unverified accounts.
- `POST /v1/auth/request-password-reset` — returns a non-enumerating response and sends a one-hour reset link when eligible.
- `POST /v1/auth/reset-password` — changes the password and revokes active sessions.
- `GET /v1/auth/me` and authenticated feature routes — require a verified account.
