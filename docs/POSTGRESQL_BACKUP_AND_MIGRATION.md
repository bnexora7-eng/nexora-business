# ALPINOSS PostgreSQL Backup and Migration Runbook

**Priority: Critical — complete before 12 December 2026.**

## Current database

- Render resource: `nexora-business-db`
- Database: `nexora_business_db`
- Engine: PostgreSQL 18
- Region: Frankfurt
- Plan: Free
- Created: 12 November 2026
- Render expiry: **12 December 2026, 14:31:31 UTC**
- Free-instance grace period: 14 days after expiry, during which the database is inaccessible unless upgraded. Render deletes it after the grace period.
- Free Postgres has **no automatic backups, logical exports, or point-in-time recovery**.

Do not treat the grace period as a backup strategy. The database becomes inaccessible at expiry.

## Current access limitation

The Render MCP SQL query failed because the database's external IP allowlist is empty. This does not prove the application cannot connect: Render services in the same region can use the database's internal connection URL.

Verified encrypted logical backups are being produced by the existing Render API backup runner. Successful backup runs are recorded from 15 through 21 November 2026. The latest verified encrypted dump is `nexora-20261120T040403Z.dump.enc` (42,675 bytes; SHA-256 `f16216855c735d663e04ed035671a1bb1d88954769a43599b208ddd9ad769dba`). The 20 November GitHub Actions run and Render backup job both completed successfully. The active runner executes `pg_dump` in custom format, validates the plaintext archive with `pg_restore --list`, encrypts it, uploads the ciphertext and manifest to the private backup repository, downloads the uploaded assets again and verifies their SHA-256. **A restore into a separate recovery database has not yet been demonstrated.**

## Required backup procedure

1. Preferred route: deploy the prepared backup Cron runner. It uses Render's private internal database connection string in Frankfurt and does not require opening the database IP allowlist.
2. Create the required private GitHub destination repository and a fine-grained token limited to that repository. Configure the token as the Render secret `GITHUB_TOKEN` and preserve the generated backup encryption key securely.
3. If the runner cannot be deployed in time, use the manual fallback below. Open the database in the Render Dashboard and go to **Connect**; obtain the **External Database URL** privately. Never paste it into GitHub, chat, screenshots, tickets, or source code.
4. Use a trusted machine with PostgreSQL client tools (`pg_dump`, `pg_restore`) installed. Add that machine's current public IP to the database's **Access Control / IP allowlist** only for the duration of the export, then remove it.
5. Run a custom-format dump. Keep the connection URL in a temporary environment variable, not in command history:

   ```bash
   pg_dump --format=custom --no-owner --no-acl --dbname="$NEXORA_EXTERNAL_DATABASE_URL" --file="nexora-business-2026-11-14.dump"
   ```

   Prefer the connection URL's TLS option (Render external connections require TLS). Do not include credentials in command-line arguments or logs.
6. Store the dump in private durable storage outside the Render database and outside this public GitHub repository. Encrypt it at rest.
6. Verify the archive with `pg_restore --list nexora-business-2026-11-14.dump`. Record file size and SHA-256 checksum. A non-empty file alone is not sufficient.
7. Restore the dump into a separate, temporary PostgreSQL 18 database. Do not restore over the live database. Verify schema, row counts, indexes, and application startup against the restored database.
8. Keep the verified dump until after the replacement database is live and a second backup has been verified.

## Migration and cutover

1. Provision a replacement PostgreSQL instance before the Free database expires. Prefer the same Frankfurt region and PostgreSQL 18 for the first migration.
2. A replacement may incur charges. **Do not create or upgrade a paid database without the owner's explicit approval.**
3. Restore the verified dump into the replacement instance.
4. Test the application against the replacement using a temporary/staging configuration first.
5. Only after successful restore and application checks, update the Render service's `DATABASE_URL` to the replacement's **internal** connection URL (same region/workspace). Do not expose the URL in GitHub or chat.
6. Redeploy and verify health, account registration/login, subscription gating, and core reads/writes.
7. Keep the old database untouched until the new instance is confirmed stable. Do not delete it before the dump and restore are verified.

## Operational safeguards

- Never put database URLs, passwords, dumps, customer data, or secret values in this repository.
- Do not use a GitHub Actions artifact as the only backup location.
- After migration, establish recurring encrypted backups to durable storage and periodically test restores.
- Record backup timestamp, file size, checksum, PostgreSQL version, and restore-test result in a private operations log.
- Do not enable real customer billing or launch production until data durability and recovery have been demonstrated.

## Current status checklist

- [x] Internal same-region Render connection used; external IP allowlist remains closed
- [x] First logical dump created (15 November 2026)
- [x] Dump archive listing verified with `pg_restore --list` before encryption
- [x] SHA-256 recorded; uploaded asset read-back verified
- [ ] Restore tested on a separate PostgreSQL 18 database
- [ ] Replacement database approved and provisioned
- [ ] Application tested against replacement
- [ ] DATABASE_URL cutover verified
- [ ] Recurring backup process established

**Historical status at original runbook creation (14 November 2026):** no verified dump; migration not performed. The current status is recorded in the dated operations section below.

## Automated encrypted backup runner — implementation status (14 November 2026)

A backup runner has been added to the public application repository under `backup/`:
- Uses PostgreSQL 18 `pg_dump` in custom format and validates the archive with `pg_restore --list` before upload.
- Encrypts the dump with AES-256-GCM; the key is derived using PBKDF2-HMAC-SHA256 (600,000 iterations). Authentication is provided by GCM.
- Uploads only ciphertext as assets attached to releases in a separate **private** GitHub repository. It downloads each uploaded asset again and verifies its SHA-256 before marking the run successful. Expired backup releases and their tags are removed after a new backup is verified; backup files are not committed to Git history.
- Retains the latest 30 days of encrypted daily backups and refuses encrypted files larger than 90 MiB.
- Active scheduler: `.github/workflows/backup-schedule.yml`, daily at 03:17 UTC. It performs a read-only preflight and triggers the authenticated `/internal/backup` endpoint on the existing Render API. The actual `pg_dump` runs inside that existing Frankfurt service using its private internal database connection. Successful runs were verified on 15, 16, 17 and 18 November 2026.
- `render-backup.yaml` is a separate, prepared Cron alternative and is **not deployed or used** by the active backup process. No Cron resource was created and no Cron charge was incurred.
- Restore helper: `backup/restore.sh`. Restore must target a separate PostgreSQL 18 recovery database, never the live database.

Required private destination: create a private GitHub repository named `nexora-private-backups` under `bnexora7-eng`, with default branch `main`. Create a fine-grained personal access token restricted to that repository with **Contents: Read and write** (Metadata read is automatic). Set it as the Render secret `GITHUB_TOKEN`; do not put it in GitHub source or chat. The backup encryption key is generated by Render as a 256-bit value and is visible in the service's Environment tab. Before the first backup, copy it into a secure password manager or another offline secret store. Do not rotate it after backups exist; without this exact key, old backups cannot be decrypted.

The prepared Render Blueprint (`exs-dbs8rmmk1f9s738k2qlg`) previously failed planning with `need_payment_info`; no Cron service was created and no charge was incurred. This inactive Blueprint is not required for the currently working backup path. The private destination repository is present, and successful uploads plus the API preflight confirm that the backup destination, GitHub token and encryption configuration are available to the running service. Secret values must remain private.

Official references:
- https://render.com/docs/cronjobs
- https://render.com/docs/free
- https://render.com/docs/postgresql-backups
- https://render.com/docs/blueprint-spec

Do not write dumps to an ephemeral filesystem and call that a backup. Do not send database credentials, dump contents, or encryption keys to logs, the public application repository, or chat. No verified backup exists until the first scheduled/manual run uploads ciphertext and passes read-back verification, followed by a separate-database restore test.


### Container and cryptography CI verification — 14 November 2026

GitHub Actions backup-runner check **43617810597** passed on commit 19aebc536b. It built the Docker image, confirmed PostgreSQL client tools at 18.7, verified GNU timeout and shell/Python syntax, performed an AES-256-GCM encrypt/decrypt round trip, and confirmed that tampered ciphertext is rejected. This validates the runner image and encryption helper only; it does **not** represent a database export or restore test.


The final Cron Blueprint now pins branch `main` and sets `autoDeploy: false` so routine application commits do not rebuild the backup service unexpectedly. Backup-runner CI run **43618325150** passed against this final Blueprint/Dockerfile revision (commit `0b5a23be44`).


## Automated backup runner preparation — 14 November 2026

- Runner source is in `backup/`; Render Blueprint is `render-backup.yaml` and is configured for a daily 03:30 UTC Cron run on the lowest approved plan (approximately $1/month), with `autoDeploy: false` to avoid rebuilds on routine application commits.
- The runner uses PostgreSQL 18 `pg_dump` custom format, validates the archive with `pg_restore --list`, encrypts with AES-256-GCM and PBKDF2-HMAC-SHA256 (600,000 iterations), uploads only encrypted release assets to a private GitHub repository, verifies downloaded asset hashes and applies 30-day retention.
- Backup runner CI run **43618325150** passed on commit `0b5a23be44`: Docker image build, PostgreSQL 18.7 client tools, shell/Python syntax, encryption/decryption and tamper rejection.
- Render Blueprint planning previously returned `need_payment_info`; **no Cron service was created and no payment was taken**. This Blueprint is inactive; the active backup scheduler uses the existing Render API service and the private destination repository.
- **Actual encrypted database dumps have been completed and uploaded.** The latest verified backup is `nexora-20261118T040615Z.dump.enc`, 42,520 bytes, created 18 November 2026 at 04:06:15 UTC. GitHub reports asset SHA-256 `2fe50f48da2edce91559ebee9a298b44dd35e5019b3bf70e9adee3319a2c66af`. The upload code verifies the downloaded asset against the original bytes before the job is marked successful. The 18 November Render backup job and GitHub Actions run both report success.
- **Restore remains unverified.** The isolated PostgreSQL 18 restore workflow exists, but no completed run was found in the recent workflow history. Do not mark the restore gate complete until that workflow successfully decrypts, lists and restores a selected backup into its disposable database and validates the resulting schema.


## Verified backup operations — 18 November 2026

- Latest successful GitHub Actions backup run: [run 4](https://github.com/bnexora7-eng/nexora-business/actions/runs/44234946355), completed 18 November 2026 at 04:06 UTC.
- Render API backup job: `583fb9f2-9fea-479b-8df5-696ad8240c2c`, status `succeeded`; the Render application log records the successful job.
- Private release: `nexora-backup-20261118T040615Z`; encrypted asset size 42,520 bytes; GitHub asset digest `sha256:2fe50f48da2edce91559ebee9a298b44dd35e5019b3bf70e9adee3319a2c66af`.
- The workflow log shows the read-only database preflight passed, the Render endpoint accepted the backup, and the final status endpoint returned `succeeded`. The API implementation marks a backup job successful only when the backup process exits with code 0. `backup/run.sh` runs `pg_dump --format=custom`, then `pg_restore --list`, then encryption and upload. `backup/upload_backup.py` downloads each uploaded release asset and compares its SHA-256 with the original bytes before reporting success.
- This is evidence of a completed logical dump, archive-list validation and encrypted asset read-back verification. It is **not** evidence of a full restore.
- Next recovery gate: manually dispatch `.github/workflows/nexora-restore-test.yml` for backup stamp `20261118T040615Z`. The workflow is designed to restore into a disposable PostgreSQL 18 service, then check application table and index counts. Do not point it at the production database.


## Verified backup operations — 20 November 2026

- Latest scheduled GitHub Actions run: [run 6](https://github.com/bnexora7-eng/nexora-business/actions/runs/44671851499), completed successfully on 20 November 2026 at 04:04:16 UTC.
- The run log confirms that the read-only preflight passed (database size 9,057,983 bytes / 8.64 MiB), Render accepted the backup request, and the authenticated status endpoint returned `succeeded`. The corresponding Render application log records backup job `504e0e87-56ce-4e4c-978a-78af13ad3574` as succeeded at 04:04:11 UTC.
- Private release: `nexora-backup-20261120T040403Z`; encrypted asset `nexora-20261120T040403Z.dump.enc`, 42,675 bytes; GitHub asset digest `sha256:f16216855c735d663e04ed035671a1bb1d88954769a43599b208ddd9ad769dba`.
- The workflow's success gate requires the Render backup job to report `succeeded`. The checked-in `backup/run.sh` executes `pg_dump --format=custom`, then `pg_restore --list`, then encryption and upload. The uploader downloads the uploaded release asset and verifies its SHA-256 before reporting success.
- This confirms the dump process, archive-list validation, encrypted upload and asset read-back verification for the 20 November run. It does **not** confirm a full restore.
- The isolated restore workflow `.github/workflows/nexora-restore-test.yml` is present, but no completed `workflow_dispatch` run for that restore workflow was found as of 20 November 2026. The recovery gate remains open.


## Verified backup operations — 21 November 2026

- Latest scheduled GitHub Actions backup run: [run 7](https://github.com/bnexora7-eng/nexora-business/actions/runs/44863901704), completed successfully on 21 November 2026 at 04:00:44 UTC.
- Read-only preflight passed. The database measured 9,066,175 bytes (8.65 MiB); the runner reported the backup destination, GitHub token and encryption configuration as present.
- Render API backup job: `71c4ce0d-8117-4d6d-9d3e-37e7d2963aa2`, status `succeeded`; Render application logs recorded success at 04:00:40 UTC.
- Private release: `nexora-backup-20261121T040031Z`; encrypted asset `nexora-20261121T040031Z.dump.enc`, 42,907 bytes; GitHub asset digest `sha256:62efa5c278dbeebc81e5979e414cf00e31c444c2f2d77b9313e42f39a47f4050`.
- The checked-in `backup/run.sh` executes `pg_dump --format=custom`, validates the resulting plaintext archive with `pg_restore --list`, encrypts it, and invokes the uploader. The uploader verifies the uploaded encrypted asset by downloading it again and comparing SHA-256. The successful Render job plus the scheduled workflow's success gate confirm that this pipeline completed.
- This confirms the 21 November logical dump, archive-list validation, encrypted upload and asset read-back verification. It does **not** confirm a full restore.
- The isolated PostgreSQL 18 restore workflow remains manual (`workflow_dispatch`). No restore-test run was found in the latest 100 repository workflow runs as of 21 November 2026. The recovery gate remains open; do not mark the backup as fully recovery-tested until a separate-database restore succeeds.
