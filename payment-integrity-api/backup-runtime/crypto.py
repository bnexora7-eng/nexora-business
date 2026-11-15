#!/usr/bin/env python3
"""Authenticated NEXORA backup encryption using AES-256-GCM and PBKDF2-HMAC-SHA256."""
import argparse
import os
from pathlib import Path
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

MAGIC = b"NEXORA1\\0"
SALT_LEN = 16
NONCE_LEN = 12
TAG_LEN = 16
MAX_ENCRYPTED_BYTES = 90 * 1024 * 1024
MAX_PLAINTEXT_BYTES = MAX_ENCRYPTED_BYTES - len(MAGIC) - SALT_LEN - NONCE_LEN - TAG_LEN
ITERATIONS = 600_000

def derive(passphrase: str, salt: bytes) -> bytes:
    if len(passphrase) < 24:
        raise SystemExit("BACKUP_ENCRYPTION_KEY must contain at least 24 characters")
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITERATIONS)
    return kdf.derive(passphrase.encode("utf-8"))

def encrypt(source: Path, target: Path, passphrase: str) -> None:
    if source.stat().st_size > MAX_PLAINTEXT_BYTES:
        raise SystemExit("Database dump exceeds the 90 MiB encrypted-backup safety limit")
    salt = os.urandom(SALT_LEN)
    nonce = os.urandom(NONCE_LEN)
    key = derive(passphrase, salt)
    ciphertext = AESGCM(key).encrypt(nonce, source.read_bytes(), MAGIC + salt)
    target.write_bytes(MAGIC + salt + nonce + ciphertext)
    os.chmod(target, 0o600)

def decrypt(source: Path, target: Path, passphrase: str) -> None:
    if source.stat().st_size > MAX_ENCRYPTED_BYTES:
        raise SystemExit("Encrypted backup exceeds the 90 MiB safety limit")
    blob = source.read_bytes()
    header_len = len(MAGIC) + SALT_LEN + NONCE_LEN
    if len(blob) <= header_len or not blob.startswith(MAGIC):
        raise SystemExit("Invalid NEXORA backup format")
    offset = len(MAGIC)
    salt = blob[offset:offset + SALT_LEN]
    nonce = blob[offset + SALT_LEN:header_len]
    key = derive(passphrase, salt)
    plaintext = AESGCM(key).decrypt(nonce, blob[header_len:], MAGIC + salt)
    target.write_bytes(plaintext)
    os.chmod(target, 0o600)

parser = argparse.ArgumentParser()
parser.add_argument("mode", choices=("encrypt", "decrypt"))
parser.add_argument("source")
parser.add_argument("target")
args = parser.parse_args()
secret = os.environ.get("BACKUP_ENCRYPTION_KEY", "")
if not secret:
    raise SystemExit("BACKUP_ENCRYPTION_KEY is required")
if args.mode == "encrypt":
    encrypt(Path(args.source), Path(args.target), secret)
else:
    decrypt(Path(args.source), Path(args.target), secret)
