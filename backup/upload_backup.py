#!/usr/bin/env python3
"""Upload an encrypted PostgreSQL dump to a private GitHub repository."""
import base64
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

repo = os.environ["BACKUP_REPOSITORY"]
token = os.environ["GITHUB_TOKEN"]
branch = os.environ.get("BACKUP_BRANCH", "main")
stamp = os.environ["BACKUP_STAMP"]
backup_path = Path(os.environ["BACKUP_FILE"])
if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repo):
    raise SystemExit("BACKUP_REPOSITORY must be owner/repository")
if not re.fullmatch(r"\d{8}T\d{6}Z", stamp):
    raise SystemExit("Invalid backup timestamp")
if not backup_path.is_file():
    raise SystemExit("Encrypted backup file is missing")

raw = backup_path.read_bytes()
MAX_BYTES = 45 * 1024 * 1024
if not raw or len(raw) > MAX_BYTES:
    raise SystemExit("Encrypted backup is empty or exceeds the 45 MiB safety limit")

headers = {
    "Accept": "application/vnd.github+json",
    "Authorization": "Bearer " + token,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "NEXORA-Encrypted-Backup",
    "Content-Type": "application/json",
}

def request(method, path, payload=None):
    url = "https://api.github.com/repos/" + repo + "/" + path.lstrip("/")
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            body = response.read()
            return json.loads(body.decode("utf-8")) if body else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read(2048).decode("utf-8", "replace")
        raise RuntimeError(f"GitHub API {method} failed ({exc.code}): {detail}") from exc

def git_blob_sha(content_bytes):
    header = f"blob {len(content_bytes)}\0".encode("ascii")
    return hashlib.sha1(header + content_bytes).hexdigest()

def put_file(path, content_bytes, message):
    payload = {
        "message": message,
        "content": base64.b64encode(content_bytes).decode("ascii"),
        "branch": branch,
    }
    result = request("PUT", "contents/" + urllib.parse.quote(path, safe="/"), payload)
    expected = git_blob_sha(content_bytes)
    actual = result.get("content", {}).get("sha")
    if actual != expected:
        raise SystemExit("GitHub returned an unexpected content hash for " + path)
    return result

repo_metadata = request("GET", "")
if repo_metadata.get("private") is not True:
    raise SystemExit("Backup destination repository must be private; refusing to upload")

base = f"backups/nexora-{stamp}"
encrypted_path = base + ".dump.enc"
manifest_path = base + ".manifest.json"
cipher_hash = hashlib.sha256(raw).hexdigest()
manifest = {
    "format": "PostgreSQL custom archive encrypted with AES-256-GCM + PBKDF2-HMAC-SHA256",
    "created_at_utc": stamp,
    "postgres_major_version": 18,
    "encrypted_file": encrypted_path,
    "encrypted_size_bytes": len(raw),
    "encrypted_sha256": cipher_hash,
    "restore_validation": "pg_restore --list passed before encryption",
}
put_file(encrypted_path, raw, f"backup: encrypted PostgreSQL dump {stamp}")
put_file(manifest_path, json.dumps(manifest, indent=2).encode("utf-8"), f"backup: manifest {stamp}")

# Read back both objects before pruning old copies.
for path, expected_bytes in ((encrypted_path, raw), (manifest_path, json.dumps(manifest, indent=2).encode("utf-8"))):
    result = request("GET", "contents/" + urllib.parse.quote(path, safe="/") + "?ref=" + urllib.parse.quote(branch, safe=""))
    if result.get("sha") != git_blob_sha(expected_bytes):
        raise SystemExit("Uploaded backup read-back hash mismatch: " + path)

# Keep 30 days of daily encrypted backups. Prune only after a new copy was uploaded and read back.
cutoff = datetime.now(timezone.utc) - timedelta(days=30)
listing = request("GET", "contents/backups?ref=" + urllib.parse.quote(branch, safe=""))
for item in listing if isinstance(listing, list) else []:
    name = item.get("name", "")
    match = re.fullmatch(r"nexora-(\d{8}T\d{6}Z)\.(dump\.enc|manifest\.json)", name)
    if not match or item.get("type") != "file" or not item.get("sha"):
        continue
    try:
        created = datetime.strptime(match.group(1), "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)
    except ValueError:
        continue
    if created < cutoff:
        delete_payload = {
            "message": f"backup: prune expired encrypted backup {name}",
            "sha": item["sha"],
            "branch": branch,
        }
        request("DELETE", "contents/backups/" + urllib.parse.quote(name, safe=""), delete_payload)

print(json.dumps({
    "status": "verified",
    "timestamp_utc": stamp,
    "encrypted_size_bytes": len(raw),
    "encrypted_sha256": cipher_hash,
    "retention_days": 30,
}))
