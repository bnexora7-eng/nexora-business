# NEXORA Monetization & Payout Architecture

Status: NEXORA has chosen one membership only — **All Access at €29.99/month**. Mollie recurring-subscription checkout exists as a preliminary web-billing scaffold but is not end-to-end tested or activated. No live payment processing is enabled.

## 1. Current commercial decision

- One public membership only: **NEXORA All Access — €29.99 per month**.
- No separate Business tier, premium tier or alternative monthly price is planned at this stage.
- NEXORA retains ownership of the platform, source code, brand and roadmap; the whole project is not being sold as a one-off asset.
- The membership should unlock only features that are implemented, tested and available. Future modules join All Access only after completion.
- Marketplace commissions or promoted listings are deferred future business-model options, not current live revenue streams.

## 2. Keep payment rails separate

### Android digital subscriptions

For subscriptions that unlock digital features or functionality consumed in the Google Play-distributed app, implement Google Play Billing unless a documented policy exception or an enrolled regional alternative-billing programme applies. The app must show clear pricing and terms. The backend must verify purchase tokens, map them to an account, process renewals/cancellations/refunds, and grant/revoke entitlements from verified events.

Official policy: https://support.google.com/googleplay/android-developer/answer/9858738

### Marketplace goods and seller payouts

Physical goods and physical services are treated differently from digital app functionality under Google Play's payments policy. A marketplace payment provider/platform product may support seller onboarding, identity/business verification, fee collection, refunds, disputes and payouts. Provider eligibility and the exact legal flow must be confirmed before selection.

Stripe Connect is one candidate to evaluate, not a selected or activated provider: https://stripe.com/connect/marketplaces

European connected-account verification can require identity, legal-entity, director and ultimate-beneficial-owner information. Verification requirements change; the integration must use the provider's hosted onboarding and current requirements rather than collecting bank data in the NEXORA app.

Reference: https://support.stripe.com/questions/europe-updated-verification-requirements-for-connected-accounts-of-platforms

## 3. Payment architecture

- Mobile client never stores card numbers, bank credentials, provider secret keys or payout bank details.
- Backend creates checkout or billing sessions and stores provider customer/account identifiers.
- Provider-hosted onboarding collects seller identity and payout details.
- Webhooks are verified server-side using provider signatures.
- Every payment event is idempotent; duplicate events cannot create duplicate orders, entitlements or payouts.
- Refunds, disputes, chargebacks, failed renewals and subscription cancellations have explicit states and audit records.
- Platform revenue and seller payable balances are ledgered separately.
- Payouts are made only by the approved provider after its KYC/KYB and capability checks.
- Test mode and production mode use separate credentials and data.

## 4. NEXORA owner payout

The future payout destination for NEXORA platform revenue is configured in the payment provider's secure dashboard/onboarding, after the operating business and account have passed the provider's checks. It is not placed in source code, GitHub, app configuration or chat.

No bank account details are needed for the current prototype. Do not attempt real payouts until the legal business setup, tax/VAT treatment, provider approval and applicable platform rules are confirmed.

## 5. Release gates

1. Confirm operating entity, registration, tax/VAT position and business model.
2. Select provider(s) and obtain written confirmation that the proposed marketplace/platform use case is supported in the Netherlands and intended launch countries.
3. Implement backend billing, signed webhooks, idempotency, ledger, refunds and disputes.
4. Implement Google Play Billing for applicable in-app digital subscriptions and server-side purchase verification.
5. Complete provider KYC/KYB, seller onboarding and payout configuration.
6. Run sandbox tests, security review, privacy/data-retention review and end-to-end reconciliation.
7. Only then enable production payments and submit the release for store review.

## 6. Current implementation status

- NEXORA mobile app now contains an own-service checkout screen.
- Backend contains authenticated Mollie-hosted checkout for one-off EUR payments and a separate preliminary recurring All Access subscription flow. The subscription flow creates a first payment, then attempts to create a monthly Mollie subscription after a verified paid webhook.
- The payment screen supports checking the stored payment status after returning from checkout.
- Required server configuration: `MOLLIE_API_KEY` (start with a test key), `PUBLIC_API_URL`, and a reachable `NEXORA_PAYMENT_RETURN_URL`. The API key must remain in Render environment variables and must never be placed in the APK or GitHub.
- The one-off and recurring billing paths are integration scaffolds, not verified live payment flows. The recurring All Access lifecycle has not yet passed Mollie test-mode end-to-end testing, and neither path is enabled for live charges or independently security-reviewed.
- A Mollie merchant account and provider verification are required before live payouts. The operating business and payout bank account must pass Mollie onboarding.
- Google Play Billing remains separate for applicable in-app digital subscriptions. Seller accounts, marketplace split payments, refunds and disputes are not implemented.
- No real payment or payout is currently possible until test verification, business onboarding and live configuration are complete.
