#!/usr/bin/env python3
"""Regression tests for backup retention pagination and deletion safety."""
import unittest
from datetime import datetime, timezone
from backup_retention import prune_expired_releases


class RetentionTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 11, 15, 12, 0, tzinfo=timezone.utc)

    def test_fetches_all_pages_before_any_delete(self):
        old = [{"id": i, "tag_name": f"nexora-backup-20261001T000000Z"} for i in range(100)]
        fresh = [{"id": 500, "tag_name": "nexora-backup-20261115T030000Z"}]
        calls = []

        def api(method, path):
            calls.append((method, path))
            if method == "GET" and path.endswith("page=1"):
                return old
            if method == "GET" and path.endswith("page=2"):
                return fresh
            return {}

        deleted = prune_expired_releases(api, 500, self.now)
        self.assertEqual(deleted, 100)
        first_delete = next(i for i, call in enumerate(calls) if call[0] == "DELETE")
        last_get = max(i for i, call in enumerate(calls) if call[0] == "GET")
        self.assertGreater(first_delete, last_get)
        self.assertEqual(sum(1 for method, _ in calls if method == "GET"), 2)

    def test_preserves_current_and_non_backup_releases(self):
        items = [
            {"id": 7, "tag_name": "nexora-backup-20261001T000000Z"},
            {"id": 8, "tag_name": "nexora-backup-20261001T000000Z"},
            {"id": 9, "tag_name": "release-v1"},
            {"id": 10, "tag_name": "nexora-backup-invalid"},
        ]
        deleted = []
        def api(method, path):
            if method == "GET":
                return items
            deleted.append(path)
            return {}
        self.assertEqual(prune_expired_releases(api, 7, self.now), 1)
        self.assertEqual(deleted, ["releases/8", "git/refs/tags/nexora-backup-20261001T000000Z"])

    def test_does_not_delete_backup_exactly_at_cutoff(self):
        at_cutoff = [{"id": 11, "tag_name": "nexora-backup-20261016T120000Z"}]
        deletes = []
        def api(method, path):
            if method == "GET":
                return at_cutoff
            deletes.append(path)
            return {}
        self.assertEqual(prune_expired_releases(api, 999, self.now), 0)
        self.assertEqual(deletes, [])

    def test_invalid_page_fails_closed(self):
        deletes = []
        def api(method, path):
            if method == "GET":
                return {"unexpected": "object"}
            deletes.append(path)
        with self.assertRaises(RuntimeError):
            prune_expired_releases(api, 999, self.now)
        self.assertEqual(deletes, [])


if __name__ == "__main__":
    unittest.main()
