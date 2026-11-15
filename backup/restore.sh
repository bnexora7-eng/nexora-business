#!/bin/sh
# Restore only into a separately provisioned PostgreSQL 18 recovery database.
# This script deliberately requires an explicit operator confirmation.
set -eu
umask 077

: "${BACKUP_ENCRYPTION_KEY:?Set BACKUP_ENCRYPTION_KEY privately}"
: "${RESTORE_DATABASE_URL:?Set RESTORE_DATABASE_URL to a separate recovery database}"
: "${RESTORE_CONFIRM_SEPARATE_DATABASE:?Set RESTORE_CONFIRM_SEPARATE_DATABASE=YES after verifying the target is NOT production}"
if [ "$RESTORE_CONFIRM_SEPARATE_DATABASE" != "YES" ]; then
  echo "Refusing restore: explicitly confirm a separate recovery database with RESTORE_CONFIRM_SEPARATE_DATABASE=YES." >&2
  exit 2
fi
: "${1:?Usage: RESTORE_CONFIRM_SEPARATE_DATABASE=YES BACKUP_ENCRYPTION_KEY=... RESTORE_DATABASE_URL=... ./restore.sh backup.dump.enc}"
if [ ! -f "$1" ] || [ ! -s "$1" ]; then
  echo "Refusing restore: encrypted backup file is missing or empty." >&2
  exit 2
fi

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT HUP INT TERM

python3 "$SCRIPT_DIR/crypto.py" decrypt "$1" "$WORK/restore.dump"
test -s "$WORK/restore.dump"
pg_restore --list "$WORK/restore.dump" > "$WORK/archive-list.txt"
test -s "$WORK/archive-list.txt"

# A single transaction prevents a partially applied restore if an object fails.
pg_restore --no-password --dbname="$RESTORE_DATABASE_URL" \
  --no-owner --no-acl --exit-on-error --single-transaction "$WORK/restore.dump"

echo "Restore command completed. Verify schema, row counts, indexes and application behavior before any cutover."
