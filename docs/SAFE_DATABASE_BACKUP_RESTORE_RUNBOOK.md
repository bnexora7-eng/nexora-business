# NEXORA — Safe PostgreSQL Backup and Restore Runbook

**Status:** prepared procedure; not yet executed  
**Last reviewed:** 15 November 2026  
**Production database:** Render PostgreSQL 18, `nexora-business-db`, Frankfurt  
**Production database ID:** `dpg-dbqsrguc6qcc7389tpdg-a`  
**Current plan:** Free; listed expiry **12 December 2026**  
**Rule:** production is read-only throughout backup verification and restore testing.

## 1. Safety boundaries

1. Never run `pg_restore` against the production `DATABASE_URL`.
2. Never use `DROP DATABASE`, `TRUNCATE`, schema replacement, or destructive migrations against production during recovery testing.
3. Do not expose database URLs, GitHub tokens, or `BACKUP_ENCRYPTION_KEY` in chat, logs, workflow output, screenshots, or committed files.
4. Keep `ENABLE_LIVE_PAYMENTS=false` and `ENABLE_ONE_OFF_PAYMENTS=false`; backup work does not require enabling either.
5. The only previously approved spend is approximately **US$1/month for the backup Cron service**. A paid recovery database or any other paid resource needs separate approval.
6. If any identity, checksum, encryption, version, target-isolation, or restore check fails, stop. Do not improvise against production.

## 2. Verified current implementation

The API repository contains `payment-integrity-api/backup-runtime/run.sh`, `crypto.py`, and `upload_backup.py`.

The current backup runner:
- creates a PostgreSQL custom-format dump with `pg_dump`;
- checks archive readability using `pg_restore --list`;
- encrypts the dump using AES-256-GCM, with a 16-byte random salt, 12-byte nonce and PBKDF2-HMAC-SHA256 (600,000 iterations);
- uploads ciphertext and a JSON manifest to releases in the designated private repository `bnexora7-eng/nexora-private-backups`;
- reads uploaded assets back and verifies their SHA-256 hashes;
- applies 30-day release retention.

The runner has a 90 MiB encrypted-artifact limit. It must fail closed if the dump exceeds this limit.

**Important distinction:** `pg_restore --list` verifies that the archive can be read; it does **not** restore a database. AES round-trip/tamper CI checks and successful upload/hash checks also do not prove database recoverability.

## 3. Current blockers — do not claim recovery readiness

- Render has not yet created the backup Cron service.
- No actual encrypted production backup has yet been confirmed in the private backup repository.
- No restore script or completed restore test is present in the inspected repositories.
- The private backup repository README explicitly requires periodic restore into an isolated PostgreSQL recovery database.
- The production database is temporary Free PostgreSQL 18 and is listed to expire on 12 December 2026.

Therefore database durability remains a **critical open release gate**.

## 4. Backup creation procedure

Perform only after the approved backup Cron resource has been reviewed and created.

1. Confirm the Cron job points to the intended production database using its private Render environment variable. Do not print the URL.
2. Confirm the designated private backup repository is exactly `bnexora7-eng/nexora-private-backups`.
3. Store `GITHUB_TOKEN` and `BACKUP_ENCRYPTION_KEY` only as private service secrets. The GitHub token must be limited to the designated private backup repository and the permissions required to create releases/assets.
4. Confirm the encryption key is at least 24 characters and preserved offline in a secure password manager or equivalent. Loss of this key makes all encrypted backups unrecoverable.
5. Run the backup job once. Require a successful exit and the runner's `status=verified` result.
6. In the private repository, verify that the matching timestamp has both the encrypted dump asset and JSON manifest. Confirm the manifest states PostgreSQL major version 18 and contains the encrypted asset SHA-256.
7. Confirm the uploaded asset read-back hash check succeeded. Never download or display a plaintext dump in an ordinary chat or public workspace.
8. Record timestamp, release/tag identifier, encrypted file size, SHA-256 and job result. Do not record secrets.

A failed or partial run is not a valid backup. Do not delete the previous known-good release to make room for a retry.

## 5. Isolated restore test — required implementation

Use an **ephemeral PostgreSQL 18 recovery instance**, separate from Render production. Preferred low-cost design: a manually triggered GitHub Actions workflow in the private backup repository, using a disposable PostgreSQL 18 service container on the hosted runner. This avoids creating a second persistent Render database. Check the repository's Actions availability/quota before enabling it; do not introduce a paid resource.

The workflow must:
1. be manually triggered only (`workflow_dispatch`); never run automatically on every push;
2. use read-only access to download a selected backup release from the private repository;
3. obtain `BACKUP_ENCRYPTION_KEY` from a repository Actions secret; never echo it;
4. verify the encrypted asset SHA-256 against the manifest **before decryption**;
5. decrypt into a temporary directory with restrictive file permissions; fail if AES-GCM authentication fails;
6. verify the PostgreSQL dump archive can be listed;
7. start a disposable PostgreSQL **18** service container with a newly generated test-only password;
8. create a new, empty recovery database in that container and restore using `pg_restore --exit-on-error --no-owner --no-acl`;
9. fail if the restore command exits non-zero; retain only non-sensitive test logs and result metadata;
10. run schema and integrity checks against the recovered database, then destroy the disposable runner/container at job completion;
11. never connect to, or receive, the production connection string.

The workflow must not upload plaintext dumps or recovered database contents as artifacts. Do not print row data, email addresses, tokens, or personal information. A successful workflow should report only backup timestamp, manifest/hash verification, PostgreSQL version, restore exit status, schema-check result, and completion time.

## 6. Restore acceptance checks

A restore is considered successful only if all checks pass:

- manifest timestamp and encrypted SHA-256 match the selected private release asset;
- AES-GCM decryption/authentication succeeds;
- archive listing succeeds;
- PostgreSQL recovery server reports major version 18;
- `pg_restore --exit-on-error` exits with code 0;
- expected application schemas and required tables exist;
- required indexes and constraints exist;
- critical table row counts are non-zero where expected and internally consistent;
- no unexpected restore errors are present;
- the test target is proven to be the disposable recovery database, not production.

Use aggregate counts and schema metadata only; do not print personal data. Record the workflow run URL and pass/fail summary. A successful restore of one selected backup proves that backup can be restored; it does not establish point-in-time recovery or a recovery-time objective.

## 7. Failure handling

- **Missing asset/manifest or hash mismatch:** mark backup invalid; preserve prior releases; investigate upload/read-back path.
- **Wrong key or AES-GCM authentication failure:** stop; do not retry against another target; verify secret custody and backup selection.
- **Archive listing failure:** mark backup invalid.
- **PostgreSQL major-version mismatch:** stop and provision the matching PostgreSQL 18 test container; do not use a different major version as a workaround.
- **Restore error:** preserve sanitized logs, mark restore test failed, fix the restore workflow, and retry only against a fresh disposable recovery database.
- **Unexpected production URL/host in workflow inputs or logs:** cancel immediately and rotate any secret that may have been exposed. Do not execute restore.

## 8. Evidence and release gate

Maintain a non-sensitive recovery record containing:
- backup timestamp and private release/tag;
- encrypted asset name, byte size and SHA-256;
- backup job result;
- restore workflow run URL;
- PostgreSQL major version;
- archive/decryption/restore/schema-check results;
- operator and UTC completion time.

Do not mark database recovery **PASS** until at least one real encrypted backup has been downloaded from the private repository, hash-verified, decrypted, and restored successfully into the isolated PostgreSQL 18 test instance.

After a passing test, repeat on a schedule and before the Render Free database expiry. Keep production payments and paid AI disabled until all independent release gates are satisfied and the owner explicitly approves activation.
