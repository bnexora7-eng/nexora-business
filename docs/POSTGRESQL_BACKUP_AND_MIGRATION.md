# NEXORA PostgreSQL Backup and Migration Runbook

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

No database contents have been exported or independently verified yet. Do not claim a backup exists until a dump has been created and its integrity checked.

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
5. Store the dump in private durable storage outside the Render database and outside this public GitHub repository. Encrypt it at rest.
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

- [ ] External connection method / allowlist resolved
- [ ] First logical dump created
- [ ] Dump archive listing verified
- [ ] SHA-256 recorded
- [ ] Restore tested on a separate database
- [ ] Replacement database approved and provisioned
- [ ] Application tested against replacement
- [ ] DATABASE_URL cutover verified
- [ ] Recurring backup process established

**Status at document creation:** no verified dump; migration not performed.

## Automated encrypted backup runner — implementation status (14 November 2026)

A backup runner has been added to the public application repository under `backup/`:
- Uses PostgreSQL 18 `pg_dump` in custom format and validates the archive with `pg_restore --list` before upload.
- Encrypts the dump with AES-256-GCM; the key is derived using PBKDF2-HMAC-SHA256 (600,000 iterations). Authentication is provided by GCM.
- Uploads only ciphertext as assets attached to releases in a separate **private** GitHub repository. It downloads each uploaded asset again and verifies its SHA-256 before marking the run successful. Expired backup releases and their tags are removed after a new backup is verified; backup files are not committed to Git history.
- Retains the latest 30 days of encrypted daily backups and refuses encrypted files larger than 90 MiB.
- Scheduled blueprint: `render-backup.yaml`, daily at 03:30 UTC in Frankfurt, smallest cron compute plan.
- Restore helper: `backup/restore.sh`. Restore must target a separate PostgreSQL 18 recovery database, never the live database.

Required private destination: create a private GitHub repository named `nexora-private-backups` under `bnexora7-eng`, with default branch `main`. Create a fine-grained personal access token restricted to that repository with **Contents: Read and write** (Metadata read is automatic). Set it as the Render secret `GITHUB_TOKEN`; do not put it in GitHub source or chat. The backup encryption key is generated by Render in the service environment; preserve it securely outside the service or future restores will not be possible.

The Render Blueprint was created (`exs-dbs8rmmk1f9s738k2qlg`) but its first planning attempt failed with `need_payment_info`. No cron service was created and no charge was incurred. The owner has explicitly approved a maximum of $1/month for this backup Cron service only; Render still requires a payment method on the account before it will plan/apply the resource. The selected `0.5c-512mb` plan is the smallest Cron compute plan; Render bills by active runtime with a $1/month minimum per Cron service. The private destination repository and scoped token are also not yet configured.

Official references:
- https://render.com/docs/cronjobs
- https://render.com/docs/free
- https://render.com/docs/postgresql-backups
- https://render.com/docs/blueprint-spec

Do not write dumps to an ephemeral filesystem and call that a backup. Do not send database credentials, dump contents, or encryption keys to logs, the public application repository, or chat. No verified backup exists until the first scheduled/manual run uploads ciphertext and passes read-back verification, followed by a separate-database restore test.
