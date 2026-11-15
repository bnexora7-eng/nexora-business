# Historical record — NEXORA All Access subscription plan

**Status: SUPERSEDED on 15 November 2026. Do not use this document as the current commercial or implementation specification.**

The earlier €29.99/month All Access subscription model was explicitly rejected by the owner.

## Current commercial model

- NEXORA accounts are free.
- No monthly membership, recurring platform fee or mandatory subscription.
- Customers pay once per individually agreed project, after scope, deliverables and price are confirmed in writing.
- Indicative public offers: €149 business analysis; €295 AI assistant prototype; €495 business-specific AI prototype; system integration from €950; €950–€2,500 multi-step automation; €5,000–€15,000+ individually scoped enterprise work.
- Public prices are indicative and do not trigger an automatic charge.
- PayPal is excluded.

## Technical safety

- `POST /v1/subscriptions/checkout` returns HTTP 410.
- One-off checkout is disabled by default and requires the explicit `ENABLE_ONE_OFF_PAYMENTS=true` flag after legal, business, provider, operational and owner approval.
- Existing Mollie recurring code and database fields are legacy compatibility components. They do not represent an active product or permission to collect recurring payments.
- Do not re-enable recurring checkout or restore subscription gates without a new explicit owner decision.

## Intended one-time project workflow

Enquiry → feasibility and scope review → written quotation → customer acceptance → compliant invoice/payment request → provider-confirmed payment → delivery and audit record.

Before real charges, verify the Dutch business registration and tax position, VAT treatment for Dutch/EU/international clients, business bank account and payment-provider eligibility, invoice/consumer terms, refunds/disputes, webhook reconciliation, backups and restore, and security acceptance.

See `docs/PRODUCTION_READINESS_MASTER.md` and `payment-integrity-api/README.md` for the current release gates.
