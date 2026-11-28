# NEXORA Mobile Platform — Android-first roadmap

**Status:** Approved product direction; implementation plan  
**Date:** 12 November 2026  
**Product decision:** One NEXORA platform with Payment Integrity as a product module.

## Product structure

NEXORA is the parent product and mobile application. The first mobile release should establish the platform shell and account experience, then add modules incrementally.

1. **Home / Discover** — entry point, announcements and discovery.
2. **Community** — member profiles and posts; messaging only after server-side identity, moderation and abuse controls exist.
3. **Marketplace** — service and collaboration listings; no payments or escrow in the first release.
4. **Business Tools** — guided planning and business workflows. Do not present a simulated assistant as connected AI.
5. **Payment Integrity** — a separate business-facing module for synthetic-event demonstrations initially; production use requires a deployed and secured backend, provider sandbox validation and security review.
6. **Account & Settings** — registration, sign-in, profile, privacy, support and account deletion.

## Recommended technical direction

- **Mobile client:** React Native + Expo + TypeScript. This gives an Android-first delivery path while preserving a practical route to iOS from one codebase.
- **Navigation:** Expo Router or React Navigation; choose one when the app scaffold is created and keep navigation typed.
- **Backend:** retain the existing Node.js API direction for Payment Integrity, but do not assume the current scaffold is production-ready or connected to the app.
- **Data:** use a managed PostgreSQL service only after choosing a provider, reviewing costs, access controls, backups and data residency.
- **Authentication:** select a maintained identity provider or implement a reviewed authentication service before real accounts are enabled. Never store raw passwords in the mobile app.
- **API:** typed HTTPS API; secrets remain server-side. No API keys or signing secrets in the app bundle.
- **Delivery:** GitHub Actions for checks; Android internal testing first; Google Play closed testing and policy review before public release.

## Release sequence

### Phase 0 — product and technical foundation
- Confirm one primary user group and the first useful user task.
- Define privacy, moderation, safety and account-deletion requirements.
- Create the Expo TypeScript app shell, app icon, theme, navigation and environment configuration.
- Add automated lint/type checks and a reproducible Android build process.
- Keep demo content clearly labelled and separate from live user data.

### Phase 1 — private Android alpha
- Home / Discover shell.
- Account registration and sign-in only after backend authentication is ready.
- Basic profile and settings.
- Community feed using seeded demo content first.
- No real-money rewards, paid entries, cash prizes, withdrawals or payment processing.
- Test on physical Android devices and collect feedback from a small invited group.

### Phase 2 — first real platform functions
- Server-backed profiles and posts.
- Reporting, blocking, moderation and abuse prevention before opening user-generated content broadly.
- Marketplace listings with moderation and clear seller terms.
- Business Tools with explicit disclosure when any assistant is simulated or when a live model is connected.
- Privacy policy, terms, support contact and account deletion workflow.

### Phase 3 — Payment Integrity module
- Deploy and harden the separate backend.
- Complete database-backed tests against a real test database.
- Add provider sandbox integration only for a selected provider and use case.
- Add role-based access, audit retention, monitoring, incident handling and security review.
- Keep the module clearly business-facing; no claim of production fraud detection without independent validation.

### Phase 4 — Google Play release
- Create and verify the Google Play developer account.
- Prepare store listing, screenshots, content rating, privacy disclosures, data safety form and support details.
- Meet current testing requirements applicable to the developer account.
- Run closed testing, fix issues and submit for review.
- Publish only after the app meets Play policies and the core user journeys work reliably.

## Non-negotiable release gates

- No false claims of live AI, real payment processing, bank integrations, security certification or traction.
- No real user accounts until authentication, privacy, secure storage and account deletion are implemented and tested.
- No user-generated content at public scale until reporting, blocking and moderation workflows are functional.
- No in-app purchases, cash rewards, paid competitions or money movement in the initial release.
- No production payment data in the current demo.
- No paid cloud resources, subscriptions or developer-account purchases without founder approval.
- Confirm Google Play's current fees, testing and verification rules immediately before enrollment; do not assume they are unchanged.

## Immediate next engineering tasks

1. Create an Expo + TypeScript mobile app scaffold in `apps/mobile`.
2. Implement the NEXORA visual shell and typed navigation with placeholder screens.
3. Add CI checks for formatting, linting and TypeScript.
4. Produce an Android development build and test on a physical device.
5. Review the first alpha before adding accounts or connecting backend services.

## Current verified starting point

The repository currently contains a static HTML/CSS/JavaScript interactive concept prototype and a separate pre-production Node.js/PostgreSQL Payment Integrity backend scaffold. The browser prototype and backend are not connected as one deployed service. This roadmap does not imply that a native Android application has already been built or published.


## Revenue model and founder payouts

The product must be designed to generate sustainable revenue. Revenue is a core product requirement, not an afterthought.

### Proposed revenue streams

1. **Free tier:** basic discovery and community participation to reduce adoption friction.
2. **NEXORA Premium:** recurring subscription for clearly defined additional digital features, subject to Google Play billing rules and any eligible EEA alternative-billing programme requirements.
3. **NEXORA Business:** paid business plans for enhanced listings, business tools, analytics or workflow features.
4. **Marketplace fees:** a disclosed commission or service fee on eligible marketplace transactions, introduced only after marketplace, seller, consumer-protection, tax and payment-provider requirements are reviewed.
5. **Payment Integrity:** separate B2B subscription/API pricing only after the backend is deployed, secured, tested and validated with customers.

### Payment and payout architecture

- Customer payments must be processed by an established payment provider or, for Play-distributed digital features, Google Play Billing unless a valid policy exception or enrolled EEA programme applies.
- The platform must record orders, subscription status, refunds, chargebacks, provider fees and payout reconciliation server-side.
- Net proceeds should be paid to a verified bank account controlled by the legally entitled payee, after processor/platform fees, refunds, taxes and other liabilities.
- Founder payouts are not the same as gross sales. The legal recipient and payout route must match the actual legal/tax structure and the provider's verification requirements.
- Marketplace seller proceeds must be kept distinct from NEXORA's own revenue. Do not route customer funds or seller balances through the founder's personal account.
- Never store card details or payment-provider secret keys in the mobile app or public repository.

### Legal and operational prerequisite

NEXORA is currently an independent project and is not represented as an incorporated company. Before accepting customer payments or receiving business revenue, confirm the correct Dutch legal/tax structure, invoicing/VAT obligations, business bank-account requirements and payment-provider onboarding rules. Do not assume a personal bank account is an acceptable business payout account. No payment processor, paid service or bank account is to be opened or charged without the founder's explicit approval.

### Google Play compliance

Digital subscriptions and paid app features normally require Google Play Billing for Play-distributed apps, unless a documented exception or applicable enrolled programme applies. Google provides EEA alternative-billing and external-offer programmes, but they carry additional eligibility, user-disclosure, API and service-fee requirements. Physical goods and physical services are treated differently. Confirm the policy and programme terms immediately before implementation and release.

Official references:
- https://support.google.com/googleplay/android-developer/answer/10281818
- https://support.google.com/googleplay/android-developer/answer/9858738
- https://support.google.com/googleplay/android-developer/answer/6112435

### Revenue release gates

- [ ] Define the exact Premium and Business features users will pay for.
- [ ] Confirm pricing, renewal, cancellation, refund and support terms.
- [ ] Choose the legal payee and verify Dutch registration/tax requirements.
- [ ] Select a payment provider and confirm payout eligibility and fees.
- [ ] Implement server-side payment verification and reconciliation.
- [ ] Test refunds, failed renewals, chargebacks and subscription entitlement changes.
- [ ] Confirm Google Play billing / EEA programme compliance for every digital SKU.
- [ ] Confirm the founder's lawful route for receiving net proceeds into an appropriate bank account.
