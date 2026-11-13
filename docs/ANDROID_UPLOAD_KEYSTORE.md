# NEXORA Android upload key — owner instructions

The replacement upload keystore was generated and verified by the repository owner on 13 November 2026.

- File on the owner's Termux device: `$HOME/nexora-upload-2026.jks`
- Alias: `nexora-upload-2026`
- Key algorithm: RSA 4096-bit
- Validity: 10,000 days
- Format: JKS
- SHA-256 certificate fingerprint: `73:5A:57:35:B3:FB:48:E6:71:B4:B4:62:18:36:1A:75:57:E7:11:D1:81:5A:72:E0:F3:50:3E:5F:EC:82:60:FE`

The previous keystore's Base64 content was exposed in a chat and must be treated as compromised. Do not use the previous keystore for any release. The replacement key has not yet been configured in GitHub Actions or used to sign a release bundle.

## 1. Protect the replacement keystore

Keep the keystore file and its password in a secure backup under your control. Do not send the password or keystore contents in chat, email or commit them to Git. Do not delete the only copy.

## 2. Add GitHub Actions secrets

The repository workflow requires these four **repository Actions secrets**:

| Secret name | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Base64 encoding of `$HOME/nexora-upload-2026.jks`, without line breaks |
| `ANDROID_KEYSTORE_PASSWORD` | The new keystore password |
| `ANDROID_KEY_ALIAS` | `nexora-upload-2026` |
| `ANDROID_KEY_PASSWORD` | The key password (same as the keystore password if Return was pressed at the key-password prompt) |

On Termux, if `termux-clipboard-set` is available, copy the Base64 directly to the Android clipboard without displaying it in the terminal:

```sh
base64 -w 0 "$HOME/nexora-upload-2026.jks" | termux-clipboard-set
```

Then paste the clipboard directly into the GitHub secret value field for `ANDROID_KEYSTORE_BASE64`. Never paste the Base64 into a chat.

In GitHub, open the repository **Settings → Secrets and variables → Actions → New repository secret**. Add each secret separately. GitHub will not show a secret's value again after it is saved.

## 3. Build the Play upload bundle

After all four secrets exist, open **Actions → NEXORA Android build (Play AAB when signing key is configured) → Run workflow** on the `main` branch.

The workflow checks the secrets, decodes and verifies the keystore alias, configures release signing, builds `app-release.aab`, verifies the bundle signature, removes the temporary keystore from the runner, and uploads the AAB as a short-lived workflow artifact.

A successful debug APK build is not proof that the signed AAB has been built.

## Key safety

Do not rotate or replace the new upload key casually after the first Play upload. The Google-managed app-signing key and the upload key are different keys.
