# NEXORA BUSINESS — Master Project Status

**Last updated:** 15 November 2026  
**Project owner:** NEXORA BUSINESS  
**Repository:** https://github.com/bnexora7-eng/nexora-business

## Canonical project links

- Public NEXORA website: https://bnexora7-eng.github.io/nexora-business/
- Account: https://bnexora7-eng.github.io/nexora-business/account/
- Member workspace: https://bnexora7-eng.github.io/nexora-business/app/
- Payment Integrity demo: https://bnexora7-eng.github.io/nexora-business/payment-integrity-demo/demo.html
- API health: https://nexora-payment-integrity-api.onrender.com/health
- Source code: https://github.com/bnexora7-eng/nexora-business

## Current commercial decision

NEXORA accounts are free. There is no monthly membership, recurring platform fee or mandatory subscription. Revenue is intended to come from individually scoped services paid once per agreed project.

The public indicative prices are:
- €149 — business process analysis and AI opportunity proposal
- €295 — focused AI assistant prototype
- €495 — business-specific AI prototype
- From €950 — system integration
- €950–€2,500 — multi-step automation
- €5,000–€15,000+ — individually scoped enterprise projects

These prices are enquiry-stage indicative offers, not automatic checkout prices or a guarantee that every described service is already production-ready. Each engagement needs a feasibility review, written scope, deliverables, exclusions and customer acceptance.

PayPal is excluded.

## Verified work in this session — 15 November 2026

- GitHub Actions passed for the website deployment on commit `1589effe3794edd37fae8c821f9d59c08ec48931`.
- The pricing section is on the public site, with six service-specific email enquiry links.
- The account page states there is no monthly fee.
- Subscription checkout returns HTTP 410.
- The generic one-off Mollie checkout now fails closed by default unless `ENABLE_ONE_OFF_PAYMENTS=true` is explicitly enabled after all release gates and owner approval.
- Integration test coverage was added to verify disabled one-off checkout returns HTTP 503 and creates no payment order.
- Project documentation and OpenAPI were updated to the free-account / one-time-project model.

The newest code changes are still subject to their own GitHub Actions run. Do not describe the latest API test run as passed until the run for the newest commit is complete.

## Payment readiness — not production-ready

No payment provider is approved for live NEXORA transactions. The existing one-off checkout code is Mollie-specific, but no live merchant onboarding or end-to-end transaction has been verified. The one-off checkout feature flag must remain disabled.

Intended process:
1. Customer submits a non-binding enquiry.
2. NEXORA reviews feasibility and requirements.
3. NEXORA sends a written one-time quotation / statement of work.
4. Customer accepts the scope and terms.
5. A compliant invoice or payment request is issued under the confirmed VAT treatment.
6. Provider-confirmed payment is reconciled server-side against the order, exact amount and currency.
7. Work is delivered and the project record is closed.

Before paid trading, assess the KVK entrepreneur criteria and registration date, Belastingdienst registration/VAT status, Dutch and cross-border B2B/B2C invoicing, business bank account and payment-provider eligibility, consumer withdrawal/refund rules, support terms and accounting retention. Mollie says it serves registered businesses, not private individuals. Do not use a personal bank account as if it were a business account or try merchant onboarding without the required legal/business details.

## Product and technical status

- Public NEXORA website and Payment Integrity demo are hosted on GitHub Pages.
- API backend is hosted on Render and uses PostgreSQL.
- Account registration, email verification, login, password reset and account deletion routes exist; real transactional email delivery still needs end-to-end verification.
- Community and Marketplace have basic authenticated publishing/listing functionality. Marketplace checkout, escrow, payouts and disputes are not implemented.
- Business workspace supports authenticated save/load of basic workspace fields.
- AI planning remains unavailable for live use without a configured provider key and explicitly approved token budget.
- Payment Integrity demo uses synthetic events and deterministic ACCEPT / REVIEW / REJECT rules. It is not a bank integration, payment processor or certified fraud-detection service.
- Android build artifacts have passed CI previously, but the app is not published to Google Play and physical-device acceptance remains outstanding.

## Critical operational release gates

1. **Database recovery:** the Render PostgreSQL Free database is temporary and expires on 12 December 2026. Verify an encrypted backup and complete a restore to a separate PostgreSQL database before expiry. Do not create paid infrastructure without explicit approval.
2. **Transactional email:** configure Brevo sender/API credentials privately in Render and verify registration, verification, resend and password-reset delivery to a real inbox.
3. **Business and tax readiness:** establish the correct legal operator/business form and assess KVK and Belastingdienst obligations, VAT treatment and compliant invoices.
4. **Payment provider:** choose a provider only after eligibility and business-bank-account requirements are confirmed; complete sandbox lifecycle, webhook, refunds/disputes and idempotency tests.
5. **Security and customer terms:** review project scope, data processing, IP, delivery, acceptance, withdrawal/cancellation, refunds and support.
6. **Mobile acceptance:** test current Android build on a physical device; Play Console registration and publication are not complete.
7. **Final visual polish:** do this after core product, access, payment and operational requirements are stable.

## Source-of-truth documents

- [Production Readiness Master Record](PRODUCTION_READINESS_MASTER.md)
- [Monetization Architecture](MONETIZATION_ARCHITECTURE.md)
- [Feature Availability Matrix](ALL_ACCESS_FEATURE_MATRIX.md)
- [Project Services Terms — internal draft only](TERMS_AND_SUBSCRIPTION_DISCLOSURES_DRAFT.md)
- [Historical All Access plan — superseded](ALL_ACCESS_SUBSCRIPTION_PLAN.md)

Do not enable live payments, paid AI, or describe NEXORA as production-ready until the applicable gates have passed and the owner explicitly approves activation.
