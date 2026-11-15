# NEXORA All Access — Verified Feature Availability Matrix

**Reviewed:** 15 November 2026  
**Purpose:** Define what the current pre-production product actually does before any paid membership is activated.  
**Commercial target:** one membership, NEXORA All Access — €29.99/month. This is a target price, not an active subscription offer.

## Status definitions

- **Available in prototype:** the feature exists and its described limited workflow is implemented; this does not imply production readiness.
- **Limited / gated:** only the explicitly described subset works, or access requires an active All Access entitlement.
- **Not available:** concept, screen, or scaffold only; do not advertise it as an active paid benefit.

## Member-facing feature inventory

| Area | Verified current capability | Status | Must not be represented as |
|---|---|---|---|
| Account | Web registration, login, email-verification and password-recovery routes exist; account deletion is implemented. | Limited / gated | Fully verified transactional email delivery. Brevo sender/key and real inbox delivery remain unverified. |
| All Access membership | Server-side entitlement check exists. Intended single plan is €29.99/month. Preliminary Mollie recurring checkout and subscription lifecycle code exist. | Not available for paid activation | An active subscription, a live checkout, collected revenue, or completed Mollie merchant integration. |
| Business Studio workspace | Authenticated member can save and load business name, tagline and goals through the PostgreSQL-backed API. | Limited / gated | A complete business-management suite or production SaaS workspace. |
| Business Studio AI | Authenticated AI planning endpoint and mock-provider CI test exist. Live generation is disabled: no production provider key is configured and the monthly token limit is zero. | Not available for live use | Live AI generation or included AI usage. |
| Community | Public read preview and basic text-post publishing exist. Publishing is protected by the server-side All Access entitlement. | Limited / gated | Real-time chat, direct messages, complete social profiles, moderation operations, or a mature social network. |
| Marketplace | Public listing read and paid-member listing creation exist. | Limited / gated | Checkout, escrow, seller payouts, buyer protection, order management, or dispute resolution. |
| Payment Integrity | Public interactive demo submits synthetic payment-event data and displays deterministic ACCEPT / REVIEW / REJECT decisions. Duplicate detection is covered by backend tests. | Available in prototype | Bank connectivity, real payment processing, certified fraud detection, machine-learning decisions, or movement of money. |
| Rewards | Participation challenges and points are part of the wider product concept only; no verified operational rewards/points workflow was found in the current product routes. | Not available | Redeemable points, cash rewards, prize pools, or a working rewards wallet. |
| Android app | Android application and module navigation exist; a signed AAB build artifact has passed CI. | Limited / gated | A published Play Store app, completed device acceptance, or enabled Android subscription billing. Mollie checkout is intentionally blocked in Android pending a compliant billing route. |
| Data protection and recovery | Encrypted PostgreSQL backup workflow has completed a real backup and a daily schedule is configured. | Available with open recovery gate | A proven disaster-recovery process until a separate-database restore test has passed. |

## Access-control verification

The current API uses a shared server-side entitlement guard for:
- Community post creation (POST /v1/community/posts)
- Marketplace listing creation (POST /v1/marketplace/listings)
- Business workspace read/write (GET/PUT /v1/business/workspace)
- AI plan generation (POST /v1/business/ai-plan)

The PostgreSQL integration test checks that an unpaid account is rejected for each protected operation, that a canceled subscription retains access only through its paid-through date, and that expired access is rejected. It also exercises successful member workspace, Community and Marketplace operations with an active test entitlement. This is automated integration evidence, not a live Mollie transaction or a full physical-device acceptance test.

Public Community and Marketplace reads are previews and do not imply paid membership.

## Launch rule

Only items explicitly marked as available in the release being sold may appear as paid benefits. Keep checkout and live payments disabled until provider onboarding, test-mode lifecycle, legal disclosures, customer support and all applicable billing requirements have passed. Do not enable live AI until the owner separately approves a budget and the server-side provider configuration is tested.

## Remaining checks before this matrix can be treated as a release sign-off

1. Verify the account email journey end-to-end with a real inbox.
2. Verify locked-feature messaging and active-member flows on web and Android physical devices.
3. Complete Mollie test-mode first payment, renewal, failed payment, duplicate webhook, cancellation and account-deletion tests.
4. Select and implement the compliant Android billing route.
5. Complete legal, privacy, operator identity, tax/VAT and customer-support review.
6. Complete a separate-database restore test for the encrypted backup.

This matrix is a conservative inventory of the code and verification evidence reviewed on 15 November 2026. It is not a claim of production readiness.
