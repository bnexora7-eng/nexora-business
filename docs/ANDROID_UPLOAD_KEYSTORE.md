# NEXORA Android upload key — owner instructions

The upload keystore has been generated and verified by the repository owner on 13 November 2026. The private keystore and its backup must remain confidential. The signed Google Play workflow still requires the four GitHub Actions repository secrets listed below before it can run.

## 1. Generate the upload keystore

Use a trusted computer or a trusted Android terminal environment with OpenJDK `keytool` installed. Run:

```sh
keytool -genkeypair -v \
  -keystore nexora-upload.jks \
  -alias nexora-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

Choose a strong store password and key password. Keep the keystore file and both passwords in a secure offline backup. Do not send the passwords in chat, email or commit them to Git.

## 2. Add GitHub Actions secrets

Base64-encode the keystore file without line breaks:

```sh
base64 -w 0 nexora-upload.jks
```

In the GitHub repository, open **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret name | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Complete base64 output from the keystore file |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | `nexora-upload` |
| `ANDROID_KEY_PASSWORD` | Key password |

Do not add the keystore itself to the repository or to a public artifact.

## 3. Build the Play upload bundle

After all four secrets exist, open **Actions → NEXORA signed Google Play App Bundle → Run workflow** on the `main` branch.

The workflow:
- checks the signing secrets and key alias,
- generates the Android project,
- configures release signing from the secrets,
- builds `app-release.aab`,
- verifies the bundle signature,
- removes the temporary keystore from the runner,
- uploads the AAB as a short-lived workflow artifact.

Download the signed AAB from the completed workflow run and upload it to the Play Console.

## Key safety

The upload key must be backed up securely. Never rotate or replace it casually after the first Play upload. If it is lost, the Play App Signing upload-key reset process may be required. The Google-managed app-signing key and the upload key are different keys.
