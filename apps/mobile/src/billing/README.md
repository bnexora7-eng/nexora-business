# NEXORA Billing foundation

This folder documents the intended billing boundary. It deliberately contains no live payment SDK, merchant credentials, bank details or payment endpoint.

## Planned server-owned responsibilities

- Products and price catalogue (Premium / Business).
- Checkout-session creation through an approved provider.
- Verified provider webhooks (signature verification, replay protection and idempotency).
- Subscription entitlements and renewal/cancellation state.
- Orders, refunds, chargebacks, provider fees and payout reconciliation.
- Separate seller balances and NEXORA platform revenue for marketplace activity.

## Non-negotiable rules

- The mobile client must never decide that a payment succeeded. Only verified server-side provider events can grant entitlements.
- Never put secret keys, card data or bank login details in the app or Git repository.
- Do not route marketplace seller funds through the founder's personal account.
- The legal payee, tax treatment and bank payout account must be verified before enabling live payments.
- For Play-distributed digital goods, verify current Google Play Billing rules and applicable EEA alternative-billing programme requirements before release.
- No live charge or payout is enabled in this scaffold.

See the mobile platform roadmap for commercial and legal release gates.
