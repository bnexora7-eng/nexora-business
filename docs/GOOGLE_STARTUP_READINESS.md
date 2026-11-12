# NEXORA — Google for Startups readiness file

Last reviewed: 2026-11-11

## Verified project status

- Public GitHub repository: https://github.com/bnexora7-eng/nexora-business
- Public GitHub Pages deployment workflow completed successfully on 2026-11-11.
- Canonical interactive Payment Integrity browser demo: https://splendid-lokum-02523e.netlify.app/ (Netlify-hosted; GitHub Pages mirror remains available).
- Public project information page: https://bnexora7-eng.github.io/nexora-business/company/
- Payment Integrity backend scaffold: Node.js HTTP API, PostgreSQL schema, HMAC-SHA256 request authentication, five-minute timestamp tolerance, database uniqueness on provider_id + event_id, audit table, Docker Compose and automated tests.
- GitHub Actions integration workflow against PostgreSQL completed successfully.
- The backend has not been deployed to a public endpoint and is not connected to a real payment provider.
- The demo uses synthetic data and deterministic rules. It is not a bank connection, payment processor, certified payment product or production fraud-detection service.
- No customer count, revenue, external investment, incorporated entity, or production usage is claimed.

## Public demo API verification — 2026-11-11

The Netlify-hosted Payment Integrity demo endpoint was verified by the project owner using the public browser interface.

Public demo:
- Website: https://splendid-lokum-02523e.netlify.app/
- API route: https://splendid-lokum-02523e.netlify.app/v1/demo/events
- Health check: HTTP GET returned status `ok`, service name `NEXORA Payment Integrity Demo API`, version `0.1.0`.
- Synthetic event test: ACCEPT — passed.
- Automated browser-triggered API regression checks: REVIEW (pending event) — PASS; REJECT (failed event) — PASS; DUPLICATE (same provider/event identifier submitted twice) — PASS.
- Owner-reported result: ALL TESTS PASSED (three regression checks; four decision scenarios including the separately verified ACCEPT).

This verification applies only to the Netlify demo endpoint and its synthetic, deterministic screening rules. The separate Node.js + PostgreSQL backend scaffold described below has not been publicly deployed and is not connected to this Netlify demo. The Netlify demo uses temporary function memory, not persistent PostgreSQL storage. These tests do not establish production readiness, payment-provider integration, fraud-detection accuracy, security certification, customer usage or commercial traction.

## Current domain and email status

- The planned domain nexora.net.eu.org is not yet confirmed as registered/delegated.
- EU.org contact handles were created, but a contact record is not proof that a domain request was approved.
- Hostry Free DNS ticket #28673 was acknowledged on 2026-11-11. Hostry has not yet confirmed correction of the incorrectly named DNS zones.
- A domain-based business mailbox is not yet configured.
- Do not submit a Google application using the personal Gmail address. Google states that the business email must match the public website domain.

## Google Start tier criteria to verify before applying

According to the current Google for Startups Cloud Program pages, the Start tier is intended for digital-native technology startups that:
- have a working MVP;
- have a clear business model;
- plan to seek venture funding soon;
- were founded within the last 24 months;
- have not received Google Cloud credits beyond the free trial.

The application preparation checklist also requires:
- an active business website describing the company, founder/team and products;
- a business email matching the public website domain;
- an active 18-character Google Cloud Billing Account ID, owned/administered by a user with the same business email domain.

Google reviews applications at its discretion. Credits are not cash investment. The current Start tier benefit is up to USD 2,000 in Google Cloud credits, subject to eligibility and approval.

Official sources:
- https://cloud.google.com/startup
- https://cloud.google.com/startup/pre-funded
- https://cloud.google.com/startup/faq
- https://cloud.google.com/startup/onboarding

## Application readiness — do not submit until gaps are resolved

| Requirement | Current status | Next action |
|---|---|---|
| Working MVP | Partial: browser demo plus tested backend scaffold; backend not deployed | Deploy secured API and demonstrate end-to-end operation |
| Clear business model | Needs founder validation and customer definition | Define initial paying customer, problem, buyer and pricing |
| Venture funding plan | Not documented | Prepare a truthful, specific funding plan |
| Founded within 24 months | Not verified | Confirm legal/project founding date and entity status |
| Website | Published, describes founder/project/product and limitations | Founder must review and personalize factual copy |
| Matching business email | Missing | Obtain confirmed domain, configure mail hosting and mailbox |
| Google Cloud Billing ID | Missing | Create billing account only when ready; check payment method and potential charges |
| Domain ownership / DNS | Pending | Resolve EU.org delegation and Hostry zone setup |

## Truthful product description — draft, not a submitted application

NEXORA is an early-stage digital product project. Its initial technical workstream, Payment Integrity, explores provider-neutral screening of payment event notifications. The prototype applies deterministic validation rules and returns ACCEPT, REVIEW or REJECT decisions. The backend scaffold adds signed request authentication, replay-window checks, database-backed duplicate prevention and an audit record.

The current implementation is a pre-production prototype. It has passed automated unit and PostgreSQL-backed integration tests in GitHub Actions, but it is not deployed, does not connect to real payment providers, and has not been used with customers or live payment data.

## Required next milestones

1. Resolve the domain request and verify authoritative DNS.
2. Configure a domain-matching business mailbox.
3. Validate founder/project age and legal status against Start tier criteria.
4. Define the first customer segment and evidence-based business model.
5. Deploy the API securely and run a public synthetic-data demonstration.
6. Create the Google Cloud Billing account and verify its 18-character ID and owner email domain.
7. Re-check all current eligibility requirements and submit only when every required fact is accurate.

## Security rules

- Never put production secrets, API keys, private credentials or personal payment data in this repository.
- Never use real payment data in the demo.
- Do not claim production readiness, bank integrations, fraud-model accuracy, customer traction, revenue, incorporation or funding unless independently verified.
