# NEXORA Business — Interactive Concept Prototype

NEXORA is a proposed digital ecosystem bringing four connected experiences into one place:

1. **Community** — member profiles, posts and conversations.
2. **Rewards** — participation challenges and points.
3. **Marketplace** — service offers and collaboration opportunities.
4. **Business tools** — guided AI-style planning and a business workspace concept.

## Live demonstration

The prototype is designed to be published with GitHub Pages from the repository root. Once deployment is active, the demo URL is:

https://bnexora7-eng.github.io/nexora-business/

## Payment Integrity sandbox

A separate interactive sandbox is available at:

https://bnexora7-eng.github.io/nexora-business/payment-integrity-demo/

It demonstrates deterministic screening of simulated payment events and a session-only audit log. It is a browser-only prototype, not a live payment service. See [the demo documentation](payment-integrity-demo/README.md) for scope and limitations.

## What can be demonstrated

- Navigate between the product areas.
- Publish a local community post.
- Open sample member conversation previews.
- Complete sample challenges and see points update.
- Add a sample marketplace offer.
- Test the guided business assistant.
- Export a concise investor concept brief.

## Important prototype limitations

This is an interactive front-end concept, not a production platform. Demo content and metrics are illustrative. Interactions are stored only in the current browser session and are not shared with other users.

The prototype does **not** currently include production user accounts, server-side persistence, real-time messaging, live AI model connectivity, payment processing, cash rewards, verified user numbers, revenue or traction.

Reward points have no monetary value. No paid entry, deposits, cash prizes or withdrawals are implemented.

## Proposed next development phase

1. Validate the initial target audience and highest-value use case.
2. Design secure registration, authentication and user profiles.
3. Add a backend database and real messaging with moderation and reporting.
4. Build a compliant marketplace and integrate payments only after legal and security review.
5. Connect a production AI service with privacy controls.
6. Validate reward mechanics, operating costs and unit economics before introducing any monetary rewards.

## Technology and deployment

- Static HTML, CSS and JavaScript front end.
- No build step or package installation required.
- GitHub Actions deploys the repository root to GitHub Pages.
- The workflow is configured to enable GitHub Pages automatically on its first deployment.
- Workflow: `.github/workflows/deploy.yml`.

## Project status

**Interactive concept prototype — pre-production.** This repository is suitable for demonstrating the proposed user experience and discussing a scoped MVP. It should not be represented as a launched financial, payment or rewards service.



## Payment Integrity API backend scaffold

A separate pre-production backend scaffold now lives in [payment-integrity-api](payment-integrity-api/README.md). It includes a Node.js API, PostgreSQL schema, provider HMAC-SHA256 webhook authentication, five-minute replay protection, database-backed idempotency, a screening audit table, Docker Compose configuration and automated unit tests.

The backend is not deployed and is not connected to the browser demo. It has not yet been validated against a running PostgreSQL instance or a real payment provider. Do not send real payment data or describe it as production-ready.
