# NEXORA — Google for Startups readiness

**Reviewed:** 12 November 2026  
**Status:** preparation only — no application submitted by this update.

## 1. Target route

The first route to assess is the **Google for Startups Cloud Program — Start tier**. Google's current FAQ describes Start as intended for digital-native startups founded within the past two years, with a working MVP, a clear business model and plans to seek venture funding soon. The current program page also describes separate Scale tiers for funded startups. Do not apply for a funded Scale tier without verifiable qualifying venture funding.

Official sources (re-check immediately before submission):
- https://cloud.google.com/startup
- https://cloud.google.com/startup/faq
- https://startup.google.com/cloud/

Google's stated Start benefit is up to USD 2,000 in Google Cloud credits, subject to approval and terms. These credits are **not cash, a loan, equity investment or a sponsorship payment**. Acceptance is discretionary.

## 2. Verified NEXORA facts

- Project: NEXORA BUSINESS; Netherlands-based, founder-led digital product project.
- Repository: https://github.com/bnexora7-eng/nexora-business
- Project information page: https://bnexora7-eng.github.io/nexora-business/company/
- Payment Integrity demonstration: https://splendid-lokum-02523e.netlify.app/
- First focused product: Payment Integrity, a provider-neutral prototype for screening synthetic payment-event notifications.
- Demonstrated deterministic outcomes: ACCEPT, REVIEW, REJECT and duplicate-event detection.
- A separate Node.js/PostgreSQL backend scaffold includes HMAC-SHA256 request-signature verification, timestamp-window checks, database uniqueness for provider/event idempotency, audit records and automated tests.
- The public browser demo/API and the separate PostgreSQL backend scaffold are **not yet connected**.
- The backend scaffold is **not publicly deployed**.
- No live bank or payment-provider integration, real payment processing, production fraud detection, machine learning, regulatory certification, paying customers, revenue, production usage, external investment or incorporated legal entity is claimed.
- Demo data is synthetic. Do not submit real personal, banking or payment data.

## 3. Proposed initial customer and business model — hypothesis to validate

**Initial customer segment:** software businesses and online merchants that receive payment-status notifications/webhooks from one or more payment providers and need a consistent way to validate events, flag uncertain events and prevent duplicate processing.

**Problem hypothesis:** teams may have to implement provider-specific checks repeatedly and may lack a single auditable decision layer for incoming payment events. This is not yet validated by customer interviews or quantified evidence.

**Proposed product:** a hosted B2B software service/API that normalizes selected payment-event fields, applies configurable deterministic validation rules, identifies duplicate provider/event identifiers and returns an explainable ACCEPT / REVIEW / REJECT result with an audit record.

**Revenue hypothesis:** recurring SaaS subscription priced by monthly event volume and feature tier; optional one-time onboarding for a supported integration. Pricing, willingness to pay and unit economics are not validated. Do not present this as current revenue or a proven model.

**Validation required before application:** conduct documented discovery interviews, select one narrow provider/use case, record the buyer's workflow and pain, test willingness to pay, and define a measurable pilot outcome.

## 4. Founding-date evidence — unresolved

- The current record does **not** establish the exact date when NEXORA BUSINESS was first conceived or founded.
- An earlier conversation dated **5 November 2026** shows that the NEXORA project was already underway by that date. This is only an earliest located record in the available conversation history, **not proof that the project was founded on 5 November 2026**.
- November 2026 is also the documented period for work on the current Payment Integrity prototype; that technical milestone must not be substituted for the original project founding date.
- Before applying, the founder must establish the truthful project/company start date from contemporaneous evidence (for example, the earliest dated repository commit, project files, domain/account records or earlier planning notes).
- If the date cannot be substantiated, do not invent one or claim Start-tier age eligibility. Ask Google how to represent the applicant's actual status before submission.

## 5. Technical readiness

| Requirement | Current evidence | Gap / action |
|---|---|---|
| Working MVP | Public synthetic-data demo and API checks | Demo and separate backend are not one deployed product |
| Backend foundation | Node.js/PostgreSQL scaffold and tests | Deploy securely; connect demo to API; verify end-to-end |
| Security | HMAC verification and replay-window logic in scaffold | Key rotation, rate limiting, secrets management, monitoring, threat model and independent review |
| Customer validation | None documented | Interviews and a design partner |
| Business model | Subscription hypothesis documented | Validate buyer, pricing and unit economics |
| Public website | Project information page on GitHub Pages | Move to a controlled company domain; add final founder details and contact |
| Matching business email | Not configured | Create mailbox on the same verified domain as public website |
| Google Cloud Billing | No verified 18-character Billing Account ID recorded | Create/check only when ready; review payment method and potential charges |
| Founding date / age | Not verified | Establish the original project/company date from evidence; do not substitute the prototype build date |
| Legal entity | No incorporated entity claimed | Confirm whether Google accepts the actual applicant structure; do not invent a company registration |

## 6. Application blockers — must be resolved by founder

1. **Domain:** nexora.net.eu.org was a proposed domain only; registration/delegation is not confirmed. Hostry ticket #28673 was acknowledged, but DNS correction was not confirmed. Do not treat this domain as owned or active until independently checked.
2. **Business email:** current project email is bnexora7@gmail.com; it does not match a company website domain. Google says the business email must match the public website domain.
3. **Website:** the existing page is on github.io, not a controlled NEXORA domain. Google requires an active website describing the company, founder/team and product; placeholder or empty sites are not accepted.
4. **Billing:** no verified 18-character Google Cloud Billing Account ID and matching-domain billing owner are recorded.
5. **Age / eligibility:** exact founding date is unresolved. The Start tier currently states a 24-month founding window; do not submit a guessed date.
6. **Founder details:** add accurate founder name/profile, role, relevant experience and team status. No biography should be invented.
7. **Business model:** validate the subscription hypothesis with potential buyers.
8. **Funding plan:** document a realistic plan to seek venture funding soon, if that is genuinely the founder's intention.

## 7. Billing safety

Google Cloud credits are not cash and do not make all Google products free. Before creating a Billing Account or enabling paid services:
- review the billing account's payment method and billing settings;
- set budgets and alert thresholds;
- use least-privilege access;
- do not deploy paid resources until the founder understands potential charges;
- never assume a budget automatically stops usage.

## 8. Submission decision

**Do not submit yet.** The materials can be prepared, but the current record does not establish all Start-tier requirements. In particular, the matching domain/email, billing ID, founder details, founding-date eligibility and validated business model remain open.

When these are resolved, re-check Google's live criteria, complete the application using the founder's verified facts, and submit only after the founder reviews every answer.

## 9. Truthful short description

NEXORA Payment Integrity is an early-stage, pre-production prototype exploring a provider-neutral decision layer for incoming payment-event notifications. Its current synthetic-data demonstration applies deterministic rules to produce ACCEPT, REVIEW or REJECT outcomes and identify duplicate events. A separate Node.js/PostgreSQL backend scaffold explores signed event ingestion, replay-window checks, idempotency and audit records. The public demo and backend scaffold are not yet connected as one deployed service, and NEXORA has not processed live transactions or claimed customers, revenue or production usage.

## 10. Security rules

- Never commit API keys, passwords, private credentials, billing details or real customer/payment data.
- Never test with real banking or payment data.
- Do not claim production readiness, bank integrations, fraud-model accuracy, certification, customers, revenue, funding or incorporation unless independently verified.
