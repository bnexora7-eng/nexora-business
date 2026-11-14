#!/bin/sh
# Restore only into a separate PostgreSQL 18 recovery database.
# Never point this script at the live production database.
set -eu
umask 077
: "${BACKUP_ENCRYPTION_KEY:?Set BACKUP_ENCRYPTION_KEY privately}"
: "${RESTORE_DATABASE_URL:?Set RESTORE_DATABASE_URL to a separate recovery database}"
: "${1:?Usage: BACKUP_ENCRYPTION_KEY=... RESTORE_DATABASE_URL=... ./restore.sh backup.dump.enc}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT HUP INT TERM
python3 /backup/crypto.py decrypt "$1" "$WORK/restore.dump"
pg_restore --list "$WORK/restore.dump" > "$WORK/archive-list.txt"
pg_restore --no-password --dbname="$RESTORE_DATABASE_URL" \
  --no-owner --no-acl --exit-on-error "$WORK/restore.dump"
echo "Restore command completed. Verify schema, row counts, indexes and application behavior before any cutover."
