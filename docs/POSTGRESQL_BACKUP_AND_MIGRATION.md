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

1. Open the database in the Render Dashboard and go to **Connect**.
2. Obtain the **External Database URL** privately. Never paste it into GitHub, chat, screenshots, tickets, or source code.
3. Use a trusted machine with PostgreSQL client tools (`pg_dump`, `pg_restore`) installed. Add that machine's current public IP to the database's **Access Control / IP allowlist** only for the duration of the export, then remove it.
4. Run a custom-format dump. Keep the connection URL in a temporary environment variable, not in command history:

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