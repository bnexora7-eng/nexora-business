# Mobile dependency security exceptions

**Reviewed:** 14 November 2026  
**Scope:** Expo SDK 54 / React Native Android build toolchain.  
**Policy:** no broad severity or package allowlist. Only the exact `image-size` advisory pair below is accepted by `scripts/check-mobile-audit.mjs`.

## Accepted high-severity build-time exception

- Package: `image-size@1.2.1`
- Dependency path: `metro@0.83.3` → `image-size`
- Advisories: GHSA-5p2g-fcmc-qvqq and GHSA-w3rx-r6r6-pgpr.
- Impact described by the advisories: malformed JXL/HEIF or ICNS image data can cause an infinite loop / event-loop denial of service.
- Exposure: Metro uses this dependency while inspecting local assets during the development/build process. It is not imported by ALPINOSS app source and is not shipped as application runtime code. It must not be exposed to untrusted user-supplied files in a server/runtime path.
- Remediation status: no patched npm release is available in the current registry metadata; the advisory's stated `2.0.3` fix is not published.
- Acceptance: narrow temporary build-tool exception only. The audit script verifies both advisory IDs and the exact lockfile node path. Reassess on every Expo/Metro upgrade and remove the exception as soon as a patched release or dependency removal is available.

## Patched PostCSS

- PostCSS is pinned to `8.5.33` through the `mobile/package.json` override.
- This addresses current PostCSS source-map path traversal / file disclosure advisories in the Expo Metro build toolchain.
- The exact lockfile must continue to resolve the patched version; the audit gate must fail on any other high/critical finding.

## Lower-severity build-tool warnings

The Expo SDK 54 toolchain currently reports lower-severity advisories for transitive `deepmerge`, `glob` and `minimatch` packages. These are in the Expo/Metro configuration and build-time dependency graph, not ALPINOSS's production API or shipped mobile runtime. Automatic `npm audit fix --force` would change Expo SDK major versions and risk an unreviewed React Native migration. Do not use `--force`; upgrade Expo SDK and its aligned React Native packages as a deliberate migration with complete Android rebuild and device tests.

## Revalidation checklist

- [ ] Re-run `npm audit --omit=dev --json` after each Expo/Metro upgrade.
- [ ] Confirm PostCSS remains at 8.5.23 or later.
- [ ] Confirm `image-size` remains only in Metro's build-time dependency path.
- [ ] Remove the two-advisory exception when a patched version is published.
- [ ] If the app begins accepting/processing user-provided images in a Node runtime, reassess this exception immediately.
