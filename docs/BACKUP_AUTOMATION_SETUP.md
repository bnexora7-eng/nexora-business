# NEXORA backup automation — deployment checklist

**State: isolated branch only. Not deployed to Render. No backup has been created.**

## Design

- GitHub Actions runs daily at 03:30 UTC and can also be started manually.
- It calls the authenticated `POST /internal/backup` endpoint on the Render API.
- The API runs the PostgreSQL 18 dump inside the Render container, using Render's private `DATABASE_URL`. The database IP allowlist stays unchanged and is never opened to GitHub-hosted runners.
- The dump is checked with `pg_restore --list`, encrypted using AES-256-GCM, and uploaded as ciphertext to the separate private repository `bnexora7-eng/nexora-private-backups`.
- The upload script downloads the assets again and verifies their SHA-256 before the job reports success.
- GitHub Actions polls the authenticated job status and fails closed if the Render process disappears or status cannot be verified.

## Required Render environment variables

Configure these only after the code has been reviewed and intentionally deployed:

| Variable | Value |
| --- | --- |
| `BACKUP_TRIGGER_TOKEN` | A random secret with at least 32 characters. |
| `GITHUB_TOKEN` | Fine-grained GitHub token restricted to `bnexora7-eng/nexora-private-backups`, Contents read/write. |
| `BACKUP_REPOSITORY` | `bnexora7-eng/nexora-private-backups` |
| `BACKUP_ENCRYPTION_KEY` | A separate random secret/passphrase with at least 24 characters. Preserve it offline; without it, backups cannot be decrypted. |

The existing Render `DATABASE_URL` is reused. Do not copy it into GitHub.

## Required GitHub Actions secret

In the application repository, create the Actions secret:

- Name: `NEXORA_BACKUP_TRIGGER_TOKEN`
- Value: exactly the same value as Render's `BACKUP_TRIGGER_TOKEN`.

Never put either secret in source code, workflow YAML, chat, screenshots, or logs. Do not use the GitHub Actions token for database access.

## First-run acceptance criteria

1. Render deploy uses the API image built from `payment-integrity-api/`; PostgreSQL 18 client and Python cryptography are verified by CI.
2. `GET /ready` confirms the API can connect to the existing private database.
3. A manual GitHub Actions run returns a completed backup job.
4. The private backup repository contains an encrypted dump and manifest; no plaintext SQL or custom-format dump is uploaded.
5. The upload script confirms asset read-back and SHA-256 equality.
6. Download the encrypted asset privately, decrypt it with the preserved key, and restore it to a separate PostgreSQL 18 recovery database.
7. Verify schema, row counts, indexes and application behavior against that recovery database.

A successful workflow alone is not a restore test. Until step 6 succeeds, the database is not considered recoverable.

## Safety boundaries

- Do not change the database IP allowlist or expose PostgreSQL to the internet.
- Do not merge or deploy this branch automatically.
- Do not change the live payment, AI, or subscription environment settings.
- Do not create paid Render resources as part of this procedure.
- The Render Free web service may sleep or restart. If the job disappears, the workflow must fail rather than claim a backup succeeded.
