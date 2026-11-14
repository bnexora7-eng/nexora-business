# NEXORA BUSINESS — Interactive Concept Prototype

**Current status:** Pre-production prototype. The Payment Integrity sandbox is publicly demonstrable, but it is not a production payment or fraud-detection service.

## Live links

- **Payment Integrity demo:** https://bnexora7-eng.github.io/nexora-business/payment-integrity-demo/demo.html
- **Project overview:** https://bnexora7-eng.github.io/nexora-business/company/
- **API health:** https://nexora-payment-integrity-api.onrender.com/health
- **Source code:** https://github.com/bnexora7-eng/nexora-business

## NEXORA concept

NEXORA is a proposed digital ecosystem bringing four connected experiences into one place:

1. **Community** — member profiles, posts and conversations.
2. **Rewards** — participation challenges and points.
3. **Marketplace** — service offers and collaboration opportunities.
4. **Business tools** — guided AI-style planning and a business workspace concept.

The wider ecosystem remains an interactive concept prototype. It does not yet provide production user accounts, shared persistence, live AI connectivity, real-time messaging, or monetary rewards.

## Payment Integrity sandbox

The public demo submits synthetic payment-event data to a sandbox API and displays deterministic **ACCEPT**, **REVIEW**, or **REJECT** decisions. It also demonstrates duplicate-event detection.

The public demo/API checks and automated browser verification have passed for ACCEPT, REVIEW and REJECT; backend checks also passed for DUPLICATE. These results verify the current demonstration path only.

**Important limitations:**
- No connection to banks or live payment-provider accounts.
- No real payment processing, payouts, or movement of money.
- Rules are deterministic; this is not a validated machine-learning fraud model.
- Demo storage is temporary and is not a durable production audit trail.
- Do not submit real personal, banking, or payment data.

## Separate backend scaffold

The repository also contains a Node.js API backend scaffold with provider HMAC-SHA256 webhook authentication, timestamp-window checks, PostgreSQL idempotency and audit-related tables, account endpoints, and automated tests. Its production deployment, provider-specific integration, independent security review, privacy/legal review, and operational controls remain outstanding. Do not treat the scaffold or sandbox as production-ready.

## What can be demonstrated now

- Submit a synthetic payment event and inspect its decision.
- Exercise ACCEPT, REVIEW, REJECT and duplicate-event scenarios.
- Navigate the wider NEXORA concept areas.
- Explore sample community, rewards, marketplace and business-workspace interactions.

## Proposed next development phase

1. Validate one narrow payment-operations use case with potential design partners.
2. Define measurable MVP acceptance criteria and a provider-neutral event contract.
3. Connect and deploy the durable backend as a single reviewed architecture.
4. Complete threat modelling, independent security testing, privacy and legal/compliance review before any real-data pilot.
5. Only then consider a provider-specific integration and controlled pilot.

## Technology and deployment

- Static HTML, CSS and JavaScript front end.
- GitHub Actions deploys the public site to GitHub Pages.
- Payment Integrity demo API is hosted separately on Render.
- The separate backend scaffold and public demo API are not yet one production service.

For the current detailed handover, see [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md). For the external-facing overview, see [docs/PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md).
