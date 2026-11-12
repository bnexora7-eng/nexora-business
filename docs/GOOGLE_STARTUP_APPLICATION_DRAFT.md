# NEXORA — Google for Startups application narrative

**Status:** Working draft for founder review — NOT submitted  
**Updated:** 12 November 2026  
**Target route:** Google for Startups Cloud Program — Start tier, subject to eligibility review.

## Short project description

NEXORA is a Netherlands-based, founder-led digital product project. Its first focused product, **NEXORA Payment Integrity**, is a pre-production prototype exploring a provider-neutral decision layer for incoming payment-event notifications. It applies deterministic validation rules to synthetic event data and returns explainable ACCEPT, REVIEW or REJECT outcomes, including duplicate-event detection.

## Problem and target user

The initial customer hypothesis is software businesses and online merchants that receive payment-status notifications from one or more payment providers. These teams may need consistent validation, duplicate-event prevention and an auditable route for uncertain events.

This problem statement is a hypothesis, not a proven market finding. NEXORA has not yet completed documented customer interviews, quantified customer losses or confirmed willingness to pay.

## Product and technical work completed

- Public interactive browser demonstration using synthetic payment events.
- Demonstrated ACCEPT, REVIEW, REJECT and DUPLICATE scenarios.
- Public demo API health check and synthetic scenario regression checks.
- Separate Node.js API backend scaffold with HMAC-SHA256 request authentication, timestamp-window checks, PostgreSQL schema, database-backed idempotency and audit-record structure.
- Automated unit and PostgreSQL-backed integration tests in GitHub Actions.

**Architecture caveat:** the public demo/API and the separate PostgreSQL backend scaffold are not yet connected. The backend scaffold is not publicly deployed. The current demo is not a payment processor, bank integration, production fraud-detection service or machine-learning model. No live payment data has been processed.

## Business model hypothesis

The proposed commercial model is a recurring B2B SaaS subscription for access to the payment-event validation API and audit dashboard. Pricing would be tiered by monthly event volume and feature level, with optional one-time onboarding for a supported integration.

This is an unvalidated hypothesis. There is currently no paid customer, revenue, confirmed pricing, proven unit economics or production usage. The next validation step is to interview payment operations and software teams, identify one narrow initial integration, test willingness to pay and secure a design partner.

## Differentiation hypothesis

NEXORA aims to provide a lightweight, provider-neutral decision and audit layer rather than a payment processor or a claim of AI-based fraud detection. The present prototype demonstrates deterministic and explainable event handling. Any claim of improved fraud prevention, reduced losses or superior accuracy would require real-world validation and must not be made at this stage.

## Development roadmap

1. Complete customer discovery and select one initial buyer/use case.
2. Deploy the backend scaffold securely with managed PostgreSQL, secret management, monitoring and abuse controls.
3. Connect the public demo to the deployed API and demonstrate end-to-end event handling with synthetic data.
4. Add one provider sandbox integration after confirming the use case and technical requirements.
5. Complete independent security, privacy and legal/compliance review before any live-data pilot.
6. Run a controlled design-partner pilot and measure agreed operational outcomes.
7. Use validated evidence to refine product scope, pricing and a venture-funding plan.

## Support requested from Google

NEXORA seeks assessment for the appropriate Google for Startups Cloud Program tier and, if accepted, access to eligible Google Cloud credits, technical guidance, learning resources and startup support to develop and validate the MVP.

This is **not** a request for Google to make an equity investment or provide cash funding. Cloud credits are non-cash benefits, subject to Google's eligibility criteria and terms.

## Founder-confirmation fields — must be completed accurately before submission

- Applicant's legal name / entity name (or exact individual applicant structure accepted by Google):
- Country of registration / legal status:
- Project or company founding date: **NOT VERIFIED — do not enter a guessed date.** The earliest located conversation record shows NEXORA was already underway by 5 November 2026; this is not proof of its founding date. The November 2026 Payment Integrity prototype build date must not be substituted for the original project start date.
- Founder name and short relevant biography:
- Team members and roles (or state accurately that this is a solo-founder project):
- Public company website on a controlled domain:
- Business email matching that website domain:
- Google Cloud Billing Account ID (18 characters):
- Previous Google Cloud credits / program participation:
- Funding history:
- Whether the founder intends to seek venture funding soon, and realistic timing:
- Customer discovery completed and evidence:
- Confirmed initial customer segment and buyer:
- Pricing hypothesis and evidence:
- Product usage / pilot status:

## Eligibility checkpoint

Google's current FAQ describes the Start tier as intended for digital-native startups founded within the past two years, with a working MVP, a clear business model and plans to seek venture funding soon. The application also requires an active business website and a business email matching the website domain, plus a Google Cloud Billing Account ID. Confirm the live criteria before submission.

Official sources:
- https://cloud.google.com/startup
- https://cloud.google.com/startup/faq

Do not submit while required fields are blank or unverified. Do not invent an incorporated company, founding date, founder biography, customers, revenue, funding, integrations or product capabilities.
