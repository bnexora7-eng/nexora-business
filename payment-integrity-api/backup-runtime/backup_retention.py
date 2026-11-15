"""Safe 30-day retention for NEXORA encrypted backup releases."""
import re
from datetime import datetime, timedelta, timezone


def prune_expired_releases(api_json, current_release_id, now=None):
    """Read every page before deleting, so offset pagination cannot skip releases."""
    now = now or datetime.now(timezone.utc)
    cutoff = now - timedelta(days=30)
    all_releases = []
    page = 1
    while True:
        releases = api_json("GET", f"releases?per_page=100&page={page}")
        if not isinstance(releases, list):
            raise RuntimeError("GitHub returned an invalid release page; retention aborted")
        all_releases.extend(releases)
        if len(releases) < 100:
            break
        page += 1

    expired = []
    for item in all_releases:
        tag = item.get("tag_name", "")
        match = re.fullmatch(r"nexora-backup-(\d{8}T\d{6}Z)", tag)
        if not match or item.get("id") == current_release_id:
            continue
        try:
            created = datetime.strptime(match.group(1), "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)
        except ValueError:
            continue
        if created < cutoff:
            expired.append((item["id"], tag))

    for release_id, tag in expired:
        api_json("DELETE", "releases/" + str(release_id))
        api_json("DELETE", "git/refs/tags/" + tag)

    return len(expired)
