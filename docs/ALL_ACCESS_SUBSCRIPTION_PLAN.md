# NEXORA All Access — Product & Subscription Plan

**Decision date:** 14 November 2026  
**Product model:** one NEXORA platform, one recurring membership  
**Public price target:** **€29.99 per month**  
**Ownership:** NEXORA retains the platform, source code, brand and product roadmap. The platform is not being offered for a one-off sale.

## 1. Commercial decision

NEXORA will be developed and operated as one evolving subscription platform.

- Keep one public membership: **NEXORA All Access — €29.99/month**.
- Do not introduce extra price tiers or a €950 whole-project sale.
- Membership grants access only to features that are implemented, available and described accurately at the time of purchase.
- New features can be added to All Access as they are completed and tested.
- Any future custom business work must not transfer ownership of the NEXORA platform or its intellectual property.

The €29.99 figure is the intended public subscription price. It is not evidence that paid subscriptions are currently enabled or that revenue is being collected.

## 2. What All Access means

The membership is intended to become the single access pass for the NEXORA ecosystem: Community, Marketplace, Business tools, Payment Integrity and future modules.

**Important launch rule:** do not advertise unfinished modules as active paid benefits. Before launch, create a feature-by-feature availability matrix and mark each item as Available now, In development / coming later, or Not included in the current release.

The account dashboard must show the member's actual entitlement state, not merely a successful sign-in.

**Code audit correction (14 November 2026):** the API already has a shared `requireUser` guard that requires an authenticated account with an active All Access subscription (or a canceled subscription still within its paid-through date). Community publishing, Marketplace publishing, Business workspace operations and AI planning use this guard. Public Community / Marketplace reads remain available as previews. The PostgreSQL integration test verifies that an unpaid account is blocked from posting, that access remains during a paid-through cancellation period, and that access is denied after that period expires. Before launch, expand tests to cover every paid route, especially Marketplace and AI planning, and verify the client UI communicates locked features clearly.

## 3. Subscription and billing architecture

The repository contains a preliminary Mollie recurring-subscription flow for web accounts: authenticated checkout creation for €29.99; first payment using a Mollie customer; webhook retrieval and validation; recurring subscription creation after the first payment; and subscription status and cancellation endpoints.

This code is **not yet verified end-to-end with Mollie test mode**. It must remain disabled for live payments until test transactions, webhook retries, failed renewals, cancellation and entitlement changes are proven.

### Website

Use a provider-hosted checkout for web subscriptions only after the operating business and intended subscription use are accepted by the provider; Mollie test credentials are configured privately in Render; the full test lifecycle passes; and privacy, terms, recurring-payment disclosures, cancellation and refund handling are reviewed.

### Android / Google Play

A subscription that unlocks digital features inside the Google Play-distributed Android app must follow the current Google Play Billing rules. Do not assume that the website's Mollie checkout can also be used inside the Play Store app. Before Android monetization, verify the current policy and implement Play Billing plus server-side purchase-token verification where required, or document a valid approved regional alternative-billing route.

Keep website billing and Google Play billing as separate payment rails, but map both to the same NEXORA All Access entitlement in the backend.

## 4. Entitlement rules

- Never grant paid access based only on the browser redirect after checkout.
- Grant access only after a verified provider event / purchase verification confirms payment.
- A repeated webhook must not create duplicate subscriptions or extend access twice.
- Failed, canceled, expired, refunded or disputed payments must update entitlement according to provider state and approved business rules.
- Cancellation must stop future renewals while preserving access only through the already-paid period, where applicable.
- Account deletion and subscription cancellation must be handled consistently; deleting an account must not silently leave an unmanaged recurring charge.
- Record auditable subscription state transitions without storing card or bank credentials.

## 5. Release gates — in order

1. **Feature inventory:** inspect every NEXORA module and classify what is genuinely usable today.
2. **Access control:** verify that free accounts cannot use paid-only functionality and active members can use the promised features.
3. **Web sandbox:** configure Mollie test credentials in Render; test first payment, mandate/subscription creation, renewal, duplicate webhook, failed payment, cancellation and account deletion.
4. **Android billing decision:** verify current Play policy and implement the correct in-app billing route before charging Android users for digital access.
5. **Customer-facing terms:** publish clear price, monthly recurring interval, renewal, cancellation, refund/support and privacy information.
6. **Operations:** confirm production database persistence, backups, monitoring, provider approval, legal operator details and tax/VAT handling.
7. **Security and release review:** independently review payment and account flows before enabling live charges.

**Do not switch ENABLE_LIVE_PAYMENTS to true as a shortcut.** Live activation requires all applicable gates above and explicit business/provider readiness.

## 6. Visual design — deliberately last

The final visual-polish phase is mandatory, but it comes after the product and billing foundations are stable:
- consistent NEXORA visual identity across web and mobile;
- professional responsive layouts;
- typography, spacing, colour system, icons and illustrations;
- polished onboarding, membership dashboard and empty/error/loading states;
- accessibility and mobile usability review;
- final screenshots and store graphics.

Do not treat the current interface as the final visual design. Avoid cosmetic redesign while core membership, entitlements and billing are still being verified.

## 7. Current known state

As of 14 November 2026:
- The public account page displays the €29.99/month All Access offer and has a checkout action.
- The backend contains preliminary Mollie recurring-subscription endpoints.
- The Mollie API key has not been configured and the subscription flow has not passed a complete Mollie test-mode lifecycle.
- Paid membership is not enabled; no customer subscriptions or revenue are claimed.
- The Android app contains NEXORA modules, but its paid entitlement and Google Play Billing path are not release-ready.
- The project remains pre-production.

This plan is the source of truth for the subscription model and release sequence.