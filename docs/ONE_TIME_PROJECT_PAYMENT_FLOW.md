# NEXORA — One-time project payment flow

**Status:** architecture and release specification only. No live payment processing is approved.

## Commercial contract

NEXORA accounts are free. Each paid engagement is a separate project with a defined scope and one-time fee. The public price list is indicative; it does not create an order or authorize a charge.

## Customer lifecycle

1. **Enquiry received** — customer selects a service and describes the business problem. This is non-binding.
2. **Feasibility review** — NEXORA checks whether the promised result can actually be delivered, dependencies, data access, security and timeline.
3. **Written quotation** — identify the legal supplier and customer; define deliverables, exclusions, acceptance criteria, timeline, one-time fee, VAT treatment, third-party costs, support and cancellation/refund terms.
4. **Customer acceptance** — store the accepted quote version and timestamp. No payment request is created before acceptance.
5. **Invoice/payment request** — issue a sequential, legally compliant invoice or advance-payment request using the confirmed VAT rules and correct operator details.
6. **Hosted provider checkout** — only after merchant onboarding and explicit owner approval. The server creates an order for the exact accepted quote amount and currency.
7. **Provider reconciliation** — webhook notification triggers a server-to-server provider lookup. Match provider payment ID, internal order ID, amount, currency and expected status. Browser redirects never mark an order paid.
8. **Delivery and closure** — unlock project delivery only after verified payment (or the explicitly agreed milestone). Record completion and retain required accounting/audit data.

## Proposed order states

- `enquiry`
- `quote_draft`
- `quote_sent`
- `quote_accepted`
- `invoice_issued`
- `payment_pending`
- `paid`
- `in_delivery`
- `delivered`
- `cancelled`
- `refund_pending`
- `refunded`
- `disputed`

Every state transition must be validated server-side and recorded with timestamp, actor and reason. Payment notifications must be idempotent; repeated webhook deliveries must not duplicate payment records or trigger duplicate delivery.

## Technical guardrails

- `ENABLE_ONE_OFF_PAYMENTS` defaults to `false`; the API returns HTTP 503 and creates no order while disabled.
- `ENABLE_LIVE_PAYMENTS` remains `false` until a separate live-launch approval.
- Provider credentials stay in Render secrets and never enter the website, mobile bundle, Git history, screenshots or chat.
- Use a provider-hosted checkout; NEXORA must not collect or store card/bank credentials.
- Enforce exact order, amount and EUR currency matching on server-side reconciliation.
- Handle open, paid, failed, canceled, expired, refunded and disputed provider states.
- Add request idempotency for checkout creation and webhook processing.
- Do not mark an invoice paid from a return URL or user-submitted screenshot.
- Do not route business proceeds through a personal bank account unless the bank, provider and applicable legal/tax rules explicitly permit it. Prefer an account in the verified business operator's name.
- Do not enable the checkout flag merely to test a production deployment. Use isolated provider sandbox credentials and an approved test environment.

## Release gates

1. Confirm the legal operator, legal form and KVK/Belastingdienst status.
2. Confirm VAT treatment for Dutch, EU and non-EU B2B/B2C services.
3. Confirm business bank account ownership and payment-provider eligibility.
4. Approve customer terms, scope/acceptance, intellectual property, privacy/data processing, delivery, cancellation and refunds.
5. Complete provider sandbox tests for successful, failed, canceled, expired, refunded and disputed payments.
6. Verify webhook authentication, idempotency, amount/currency matching, logs and alerting.
7. Verify encrypted database backup and a restore to a separate database.
8. Obtain explicit owner approval before setting `ENABLE_ONE_OFF_PAYMENTS=true`; live processing additionally requires explicit approval to enable live credentials.

## Current provider research

- **Mollie:** its support documentation says it is available only to registered businesses, not private individuals. It asks for business/legal representative information, identity documents, bank details and website/service information. Merchant onboarding is premature until the business operator and account are eligible.
- **Stripe:** its support documentation says it verifies the business, website/product, bank account and risk profile. Account type and exact documentation depend on country and business structure; eligibility must be confirmed for the actual Dutch operator before selection.
- **PayPal:** excluded from NEXORA by owner decision.

References:
- KVK: https://www.kvk.nl/en/starting/do-you-need-to-register-your-business-with-kvk/
- Belastingdienst invoice requirements: https://www.belastingdienst.nl/wps/wcm/connect/bldcontenten/belastingdienst/business/vat/vat_in_the_netherlands/vat_administration/invoice_requirements
- Mollie verification: https://help.mollie.com/en/articles/25897821634322-what-does-mollie-need-to-verify-my-account
- Stripe business requirements: https://support.stripe.com/questions/business-information-requirements-to-use-stripe?locale=en
