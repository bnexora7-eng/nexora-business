# ALPINOSS monetization architecture

**Current decision: 15 November 2026**

ALPINOSS uses a free-account, one-time project-services model. There is no monthly membership, recurring platform fee or mandatory subscription.

## Revenue model

Customers can enquire about a defined service. ALPINOSS reviews feasibility and scope, provides a written quotation, and charges once for the agreed project after customer acceptance.

Indicative public prices:
- Business analysis: €149
- AI assistant prototype: €295
- Business-specific AI prototype: €495
- System integration: from €950
- Multi-step automation: €950–€2,500
- Individually scoped enterprise projects: €5,000–€15,000+

These are indicative offers, not automatic checkout prices or guarantees that every listed service is already production-ready. Final deliverables, exclusions, dependencies, timeline and fee must be agreed before work starts.

## Customer/payment lifecycle

1. Enquiry received.
2. Feasibility and requirements reviewed.
3. Written scope and one-time quotation issued.
4. Customer accepts the quote and terms.
5. Correct invoice or payment request issued under the confirmed Dutch/EU tax treatment.
6. Payment provider confirms the exact order, amount and currency server-side.
7. Work is delivered and the project record is closed.

## Provider and activation controls

- PayPal is excluded.
- Mollie is not approved or activated for ALPINOSS at this stage. Its current documentation says it serves registered businesses, not private individuals.
- The existing generic one-off Mollie checkout endpoint is disabled by default using `ENABLE_ONE_OFF_PAYMENTS`. Keep the flag unset/false until merchant eligibility, legal identity, tax treatment, business bank account, provider approval, customer terms, sandbox tests, webhook idempotency, refund/dispute handling and operational recovery are all verified.
- No private bank account should be presented as a business account or used for business collection without confirming legal, tax and bank terms.
- Existing recurring-subscription code and database columns are legacy only. They must not be reactivated or used to gate account access.
- Never grant paid status from a browser redirect; verify provider state server-side.

## Compliance and readiness

Before paid trading, assess the KVK entrepreneur criteria and registration date, Belastingdienst registration and VAT position, invoicing requirements, customer type and location (Dutch/EU/non-EU; B2B/B2C), consumer withdrawal/refund obligations, privacy, accounting records and provider terms. Obtain qualified Dutch tax/legal advice where the correct VAT treatment is uncertain.

See:
- `docs/PRODUCTION_READINESS_MASTER.md`
- `docs/ALL_ACCESS_SUBSCRIPTION_PLAN.md` (historical record only)
- `payment-integrity-api/README.md`

Do not enable real payments until the owner explicitly approves activation after every applicable release gate has passed.
