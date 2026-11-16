# ALPINOSS — Verified Feature Availability Matrix

**Reviewed:** 15 November 2026  
**Commercial model:** free accounts; individually scoped, one-time project fees for ALPINOSS services. No monthly membership or recurring platform fee.

## Status definitions

- **Available in prototype:** the limited workflow exists and has automated evidence; this does not imply production readiness.
- **Limited / gated:** only the explicitly described subset works, or access requires a verified account / configuration.
- **Not available:** concept, screen, or scaffold only; do not advertise it as a working service.

## Product feature inventory

| Area | Verified current capability | Status | Must not be represented as |
|---|---|---|---|
| Account | Web registration, login, email-verification and password-recovery routes exist; account deletion is implemented. | Limited / gated | Fully verified transactional email delivery; real inbox delivery remains unverified. |
| Account pricing | Account creation and basic access do not require a paid membership. | Available in current web flow | A monthly membership, recurring fee or paid entitlement. |
| ALPINOSS services | Public page displays six indicative one-time project offers and direct email enquiry links. | Available as enquiry / quotation entry point | Automatic checkout, guaranteed delivery capability, or a binding quote before feasibility review. |
| Business Studio workspace | Authenticated account can save and load business name, tagline and goals through the PostgreSQL-backed API. | Limited / gated | A complete business-management suite or production SaaS workspace. |
| Business Studio AI | Authenticated AI planning endpoint and mock-provider CI test exist. Live generation is disabled unless a production provider key and approved token budget are configured. | Not available for live use | Live AI generation or included AI usage. |
| Community | Public read preview and basic text-post publishing exist; publishing requires an authenticated account, not a paid membership. | Limited / gated | Real-time chat, direct messages, complete social profiles, moderation operations, or a mature social network. |
| Marketplace | Public listing read and authenticated listing creation exist. | Limited / gated | Checkout, escrow, seller payouts, buyer protection, order management, or dispute resolution. |
| Payment Integrity | Public interactive demo submits synthetic payment-event data and displays deterministic ACCEPT / REVIEW / REJECT decisions. Duplicate detection is covered by backend tests. | Available in prototype | Bank connectivity, real payment processing, certified fraud detection, machine-learning decisions, or movement of money. |
| One-time checkout | Generic Mollie checkout route exists in code but now fails closed by default with `one_off_payments_disabled`. | Disabled | Live or test checkout being available to customers. |
| Subscription billing | Subscription checkout returns HTTP 410. Old subscription code and database fields remain only for legacy compatibility. | Disabled / superseded | Any current ALPINOSS membership, recurring fee, subscription access gate or renewal. |
| Rewards | Participation challenges and points are part of the wider product concept only; no verified operational rewards/points workflow was found in the current product routes. | Not available | Redeemable points, cash rewards, prize pools, or a working rewards wallet. |
| Android app | Android application and module navigation exist; a signed AAB build artifact has passed CI. | Limited / gated | A published Play Store app or completed device acceptance. |
| Data protection and recovery | Encrypted PostgreSQL backup workflow and daily schedule are documented. | Open recovery gate | A proven disaster-recovery process until a separate-database restore test has passed. |

## Access-control verification

The current free-account model uses authentication for private or write operations; it does not require a paid subscription for account access.

The PostgreSQL integration test verifies successful authenticated Community publishing, Marketplace listing creation and Business workspace persistence. Account deletion is also tested. These are automated integration results, not full physical-device acceptance or production sign-off.

Public Community and Marketplace reads are previews. Marketplace checkout and escrow are not implemented.

## Payment and commercial release rule

Current workflow: enquiry → feasibility and scope review → written one-time quotation → customer acceptance → compliant invoice/payment request → provider-confirmed payment → delivery and audit record.

The public indicative offers are:
- €149 business analysis
- €295 AI assistant prototype
- €495 business-specific AI prototype
- System integration from €950
- €950–€2,500 multi-step automation
- €5,000–€15,000+ individually scoped enterprise work

Do not enable checkout until Dutch business/tax status, VAT treatment, provider merchant approval, business bank account, customer terms, refunds/disputes, webhook reconciliation, backups and restore, and security checks are complete. Live activation also requires explicit owner approval.

## Remaining checks before release sign-off

1. Verify account email delivery end-to-end with a real inbox.
2. Verify account and workspace flows on physical web/mobile devices.
3. Assess KVK registration and Belastingdienst/VAT obligations for the intended business activity.
4. Select and onboard an eligible payment provider after business identity and bank-account readiness.
5. Implement and test one-time project quote, invoice/payment, webhook and refund lifecycle.
6. Complete a separate-database restore test for the encrypted backup.

This matrix records the code and verification evidence reviewed on 15 November 2026. It is not a claim of production readiness.
