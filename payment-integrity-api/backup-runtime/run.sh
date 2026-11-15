#!/bin/sh
set -eu
umask 077

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${GITHUB_TOKEN:?GITHUB_TOKEN is required}"
: "${BACKUP_REPOSITORY:?BACKUP_REPOSITORY is required}"
: "${BACKUP_ENCRYPTION_KEY:?BACKUP_ENCRYPTION_KEY is required}"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT HUP INT TERM
DUMP="$WORK/nexora-${STAMP}.dump"
ENCRYPTED="$DUMP.enc"

echo "NEXORA backup started: $STAMP"
pg_dump --no-password --format=custom --no-owner --no-acl --dbname="$DATABASE_URL" --file="$DUMP"
pg_restore --list "$DUMP" > "$WORK/archive-list.txt"
test -s "$DUMP"
python3 /backup/crypto.py encrypt "$DUMP" "$ENCRYPTED"
test -s "$ENCRYPTED"

export BACKUP_STAMP="$STAMP"
export BACKUP_FILE="$ENCRYPTED"
python3 /backup/upload_backup.py

echo "NEXORA backup uploaded and verified: $STAMP"
