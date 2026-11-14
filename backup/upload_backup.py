#!/usr/bin/env python3
"""Upload an authenticated encrypted PostgreSQL dump as a private GitHub Release asset."""
import hashlib
import json
import os
import re
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

encrypted = backup_path.read_bytes()
if not encrypted or len(encrypted) > 90 * 1024 * 1024:
    raise SystemExit("Encrypted backup is empty or exceeds the 90 MiB safety limit")

base_url = "https://api.github.com/repos/" + repo
headers = {
    "Accept": "application/vnd.github+json",
    "Authorization": "Bearer " + token,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "NEXORA-Encrypted-Backup",
}

def api_json(method, path, payload=None):
    url = base_url + ("/" + path.lstrip("/") if path else "")
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={**headers, "Content-Type": "application/json"}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=90) as response:
            body = response.read()
            return json.loads(body.decode("utf-8")) if body else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read(2048).decode("utf-8", "replace")
        raise RuntimeError(f"GitHub API {method} failed ({exc.code}): {detail}") from exc

def raw_request(method, url, data=None, accept="application/vnd.github+json", content_type=None):
    request_headers = {**headers, "Accept": accept}
    if content_type:
        request_headers["Content-Type"] = content_type
    req = urllib.request.Request(url, data=data, headers=request_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=180) as response:
            return response.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read(2048).decode("utf-8", "replace")
        raise RuntimeError(f"GitHub asset transfer failed ({exc.code}): {detail}") from exc

def download_asset(asset_id):
    # GitHub may redirect the authenticated asset API request to a CDN.
    # Do not let urllib forward the repository token to that second host.
    url = base_url + "/releases/assets/" + str(asset_id)
    request = urllib.request.Request(
        url,
        headers={**headers, "Accept": "application/octet-stream"},
        method="GET",
    )
    # Use a handler that refuses redirects so the credential-bearing request
    # cannot silently forward Authorization to a different hostname.
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, response_headers, newurl):
            return None

    opener = urllib.request.build_opener(NoRedirect())
    try:
        with opener.open(request, timeout=180) as response:
            return response.read()
    except urllib.error.HTTPError as exc:
        if exc.code not in (301, 302, 303, 307, 308):
            detail = exc.read(2048).decode("utf-8", "replace")
            raise RuntimeError(f"GitHub asset download failed ({exc.code}): {detail}") from exc
        location = exc.headers.get("Location")
        exc.close()
    if not location:
        raise RuntimeError("GitHub asset redirect did not include a Location header")
    parsed = urllib.parse.urlsplit(location)
    host = parsed.hostname or ""
    if (
        parsed.scheme != "https"
        or not (host == "github.com" or host.endswith(".githubusercontent.com"))
        or parsed.username
        or parsed.password
        or parsed.port not in (None, 443)
    ):
        raise RuntimeError("GitHub asset redirect target is not an approved HTTPS host")
    # The signed CDN URL is sufficient; deliberately send no GitHub token.
    request = urllib.request.Request(
        location,
        headers={"User-Agent": "NEXORA-Encrypted-Backup", "Accept": "application/octet-stream"},
        method="GET",
    )
    with urllib.request.urlopen(request, timeout=180) as response:
        return response.read()

metadata = api_json("GET", "")
if metadata.get("private") is not True:
    raise SystemExit("Backup destination repository must be private; refusing to upload")

tag = "nexora-backup-" + stamp
manifest = {
    "format": "PostgreSQL custom archive encrypted with AES-256-GCM + PBKDF2-HMAC-SHA256",
    "created_at_utc": stamp,
    "postgres_major_version": 18,
    "encrypted_file": backup_path.name,
    "encrypted_size_bytes": len(encrypted),
    "encrypted_sha256": hashlib.sha256(encrypted).hexdigest(),
    "restore_validation": "pg_restore --list passed before encryption",
}
manifest_bytes = json.dumps(manifest, indent=2).encode("utf-8")

release = api_json("POST", "releases", {
    "tag_name": tag,
    "target_commitish": branch,
    "name": "NEXORA encrypted database backup " + stamp,
    "body": "Automated encrypted PostgreSQL 18 backup. Ciphertext assets only; AES-256-GCM authenticated encryption.",
    "draft": False,
    "prerelease": False,
})
release_id = release.get("id")
upload_url = release.get("upload_url", "").split("{", 1)[0]
if not release_id or not upload_url:
    raise SystemExit("GitHub did not return a valid release upload endpoint")

def upload_asset(name, payload):
    url = upload_url + "?name=" + urllib.parse.quote(name, safe="")
    response = raw_request("POST", url, payload, content_type="application/octet-stream")
    result = json.loads(response.decode("utf-8"))
    if result.get("size") != len(payload):
        raise SystemExit("GitHub asset size mismatch for " + name)
    downloaded = download_asset(result["id"])
    if hashlib.sha256(downloaded).digest() != hashlib.sha256(payload).digest():
        raise SystemExit("GitHub asset read-back hash mismatch for " + name)
    return result

dump_asset = upload_asset(backup_path.name, encrypted)
manifest_asset = upload_asset("nexora-" + stamp + ".manifest.json", manifest_bytes)

# Keep 30 days of daily releases. Delete only releases created by this backup job.
cutoff = datetime.now(timezone.utc) - timedelta(days=30)
page = 1
while True:
    releases = api_json("GET", f"releases?per_page=100&page={page}")
    if not isinstance(releases, list) or not releases:
        break
    for item in releases:
        old_tag = item.get("tag_name", "")
        match = re.fullmatch(r"nexora-backup-(\d{8}T\d{6}Z)", old_tag)
        if not match or item.get("id") == release_id:
            continue
        try:
            created = datetime.strptime(match.group(1), "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)
        except ValueError:
            continue
        if created < cutoff:
            api_json("DELETE", "releases/" + str(item["id"]))
            api_json("DELETE", "git/refs/tags/" + urllib.parse.quote(old_tag, safe=""))
    if len(releases) < 100:
        break
    page += 1

print(json.dumps({
    "status": "verified",
    "timestamp_utc": stamp,
    "release_id": release_id,
    "encrypted_size_bytes": len(encrypted),
    "encrypted_sha256": manifest["encrypted_sha256"],
    "release_assets_verified": [dump_asset["name"], manifest_asset["name"]],
    "retention_days": 30,
}))
