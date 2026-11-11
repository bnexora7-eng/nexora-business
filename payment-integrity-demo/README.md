# NEXORA Payment Integrity — Interactive Sandbox

## Purpose
This folder contains a browser-only technical demonstrator for a proposed payment-event screening product.

## Run
Open `index.html` in a browser, or publish the repository with GitHub Pages and visit:

`https://bnexora7-eng.github.io/nexora-business/payment-integrity-demo/`

## Demonstrated behavior
- Screens simulated event data using explicit deterministic rules.
- Detects repeated provider + event identifiers within the current page session.
- Flags pending events and illustrative high-amount cases for review.
- Rejects failed-status events and invalid or duplicate inputs.
- Produces an explainable decision and a session-only audit table.

## Important limitations
This is not a payment processor, fraud detection model, bank integration, webhook receiver, or production security product. It does not verify cryptographic signatures, persist audit records, authenticate users, call external services, or move money. All data is illustrative and remains in the browser session.

## Proposed engineering roadmap
1. Define a provider-neutral event schema and threat model.
2. Implement a backend API with authenticated ingestion and idempotency constraints.
3. Verify provider webhook signatures using provider-specific secrets and rotation.
4. Persist immutable audit events and decision metadata in a database.
5. Add configurable risk rules, test fixtures, and automated unit/integration tests.
6. Add observability, access controls, retention policy, privacy review, and security testing.
7. Validate the product with design partners before making performance or fraud-prevention claims.

## Current status
Interactive front-end sandbox — pre-production. No production readiness or customer traction is claimed.
