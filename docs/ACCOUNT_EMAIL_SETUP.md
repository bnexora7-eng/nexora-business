# NEXORA account email delivery

Account registration now requires email verification. Password reset links are single-use and expire after one hour; verification links are single-use and expire after 24 hours. Password reset revokes every active session for that account.

## Gmail SMTP configuration

The API sends transactional messages through the NEXORA mailbox using Gmail SMTP and a Google App Password. Never put these values in the repository, website JavaScript, mobile app, or a GitHub Actions file.

1. Sign in to the Google account `bnexora7@gmail.com`.
2. Enable Google 2-Step Verification if it is not already enabled.
3. In the Google Account security settings, create an App Password for the NEXORA server. Google may not show App Passwords for some account/security configurations.
4. In the API hosting provider's server-side environment settings, add:

| Variable | Value |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | `bnexora7@gmail.com` |
| `SMTP_APP_PASSWORD` | The generated Google App Password (not the normal Gmail password) |
| `SMTP_FROM` | `NEXORA <bnexora7@gmail.com>` |
| `NEXORA_ACCOUNT_URL` | `https://bnexora7-eng.github.io/nexora-business/account` |

5. Save the environment settings and redeploy/restart the API. Do not send the App Password in chat or commit it to GitHub.

If Gmail App Passwords are unavailable for this Google account, stop here and use a dedicated transactional email provider rather than weakening Google account security.

## Database and deployment

The API startup runs `src/schema.sql`, which adds the email verification timestamp and one-use token table. Deploy the API branch only after reviewing the pull request and ensuring the production database is backed up.

## Endpoints

- `POST /v1/auth/register` — creates a pending account and sends a 24-hour verification link; does not issue a session.
- `POST /v1/auth/verify-email` — consumes the one-use verification token.
- `POST /v1/auth/resend-verification` — sends a replacement link for a pending account.
- `POST /v1/auth/login` — refuses unverified accounts.
- `POST /v1/auth/request-password-reset` — returns a non-enumerating response and sends a one-hour reset link when eligible.
- `POST /v1/auth/reset-password` — changes the password and revokes active sessions.
- `GET /v1/auth/me` and authenticated feature routes — require a verified account.

The public account pages are `account/verify.html`, `account/forgot-password.html`, and `account/reset-password.html`.
