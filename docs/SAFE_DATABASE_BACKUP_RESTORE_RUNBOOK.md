# NEXORA — Safe PostgreSQL Backup and Restore Runbook

**Status:** procedure and manual test workflow prepared; no real backup restore has run yet.  
**Production database:** Render PostgreSQL 18, `nexora-business-db`, Frankfurt.  
**Listed Free-plan expiry:** 12 December 2026.  
**Safety rule:** all restore tests use a disposable PostgreSQL 18 service container on a GitHub-hosted runner. Production is never a restore target.

## 1. Safety boundaries

- Never run `pg_restore` against production `DATABASE_URL`.
- Never run destructive SQL or schema replacement against production during recovery testing.
- Never put database URLs, GitHub tokens or encryption keys in chat, logs, screenshots or committed files.
- Keep live payments and one-off checkout disabled. Backup work does not require enabling them.
- Only the previously approved backup Cron cost (approximately US$1/month) is in scope. Any other paid resource requires separate approval.
- Stop on any mismatch or unexpected target; do not improvise against production.

## 2. Existing backup implementation

Inspected files in `payment-integrity-api/backup-runtime/`:
- `run.sh`: PostgreSQL custom-format dump, `pg_restore --list`, encryption, upload.
- `crypto.py`: AES-256-GCM; 16-byte random salt; 12-byte nonce; PBKDF2-HMAC-SHA256 with 600,000 iterations.
- `upload_backup.py`: uploads ciphertext and JSON manifest to private repository `bnexora7-eng/nexora-private-backups`, reads assets back and verifies SHA-256, applies 30-day retention.

The runner has a 90 MiB encrypted-artifact limit. `pg_restore --list` checks archive readability only; it is not a database restore. CI crypto tests and successful upload/hash checks do not prove recoverability.

## 3. Manual restore workflow

Workflow file: `.github/workflows/nexora-restore-test.yml` in the **nexora-business application repository**. It is deliberately `workflow_dispatch` only and runs against a disposable PostgreSQL 18 service container. It:
1. validates a UTC backup timestamp;
2. downloads the matching encrypted dump and manifest from the private backup repository;
3. verifies timestamp, filename, PostgreSQL major version, file size and SHA-256 before decryption;
4. authenticates/decrypts using the existing `crypto.py`;
5. checks archive readability and PostgreSQL 18 server version;
6. restores into a newly created disposable database with `pg_restore --exit-on-error --no-owner --no-acl`;
7. verifies that application tables exist and reports only aggregate schema counts;
8. removes temporary plaintext files; the hosted runner and database service are ephemeral.

No production database URL is passed to this workflow. It does not upload plaintext dumps or recovered database contents as artifacts.

### Required GitHub Actions secrets

In the **nexora-business** repository, configure:
- `BACKUP_READ_TOKEN`: fine-grained token with read-only Contents access to `bnexora7-eng/nexora-private-backups` (needed to download private release assets).
- `BACKUP_ENCRYPTION_KEY`: the exact existing backup encryption passphrase, at least 24 characters.

Do not create a new encryption key for restore testing; it must match the key used when the backup was encrypted. Do not paste either secret into chat. The workflow uses GitHub's ephemeral `GITHUB_TOKEN` only as the disposable test database password.

After a real backup release exists, run **Actions → NEXORA isolated PostgreSQL restore test → Run workflow**, entering the timestamp from its release tag, for example the timestamp portion of `nexora-backup-YYYYMMDDTHHMMSSZ`.

## 4. Backup creation gate

The Render backup Cron service has not yet been created. No actual encrypted production backup has yet been confirmed in the private repository. Before the restore workflow can run:
1. review and create only the previously approved backup Cron resource;
2. configure its GitHub upload token and encryption key as private Render secrets;
3. run it and confirm both encrypted dump and manifest exist in the private release;
4. confirm the runner reports `status=verified` and successful asset read-back hash checks.

A failed or partial run is not a valid backup. Preserve prior known-good releases.

## 5. Restore acceptance criteria

Do not mark database recovery PASS until one real backup has:
- matching manifest timestamp, filename, size and SHA-256;
- successful AES-GCM authentication/decryption;
- successful archive listing;
- PostgreSQL major version 18 confirmed;
- `pg_restore --exit-on-error` exit code 0;
- application tables and indexes present after restore;
- no unexpected restore errors;
- verified disposable target, not production.

Record only non-sensitive evidence: backup timestamp, release tag, encrypted file size/hash, workflow run URL, PostgreSQL version, pass/fail results and UTC completion time. Do not query or print personal row data.

## 6. Current release status

- Backup Cron: not created.
- Real encrypted backup: not yet confirmed.
- Restore workflow: committed, but not yet run.
- Real restore: not yet tested.
- Production database: temporary Free PostgreSQL 18; listed expiry 12 December 2026.

Database durability remains a critical open release gate. Keep paid functionality disabled until a real restore passes and all other release gates are satisfied.
