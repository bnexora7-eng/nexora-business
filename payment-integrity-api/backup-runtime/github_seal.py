#!/usr/bin/env python3
"""Encrypt one plaintext value with GitHub's libsodium sealed-box format."""
import base64
import json
import sys

from nacl.public import PublicKey, SealedBox


def main() -> None:
    payload = json.load(sys.stdin)
    public_key = base64.b64decode(payload["public_key"], validate=True)
    plaintext = payload["plaintext"].encode("utf-8")
    encrypted = SealedBox(PublicKey(public_key)).encrypt(plaintext)
    sys.stdout.write(base64.b64encode(encrypted).decode("ascii"))


if __name__ == "__main__":
    main()
