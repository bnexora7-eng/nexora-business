# NEXORA BUSINESS — Project Brief

**Status:** Early-stage, pre-production prototype  
**Location:** Netherlands  
**Repository:** https://github.com/bnexora7-eng/nexora-business  
**Interactive Payment Integrity demo:** https://splendid-lokum-02523e.netlify.app/  
**Project information:** https://bnexora7-eng.github.io/nexora-business/company/

## Overview

NEXORA is a founder-led digital product project. Its first focused technical workstream, **NEXORA Payment Integrity**, explores screening payment-event notifications and returning explainable ACCEPT, REVIEW or REJECT decisions while identifying duplicate event identifiers.

The current public sandbox uses synthetic data and deterministic rules. It is intended for technical discussion and early customer discovery, not live financial operations.

## What can be evaluated now

- Submit a synthetic payment event through the interactive browser demo.
- See ACCEPT, REVIEW or REJECT decisions with an explanation.
- Detect a repeated provider/event identifier as a duplicate.
- Review a session-only audit view in the browser.
- Run public API checks for ACCEPT, REVIEW, REJECT and DUPLICATE.

## Engineering work completed

The repository contains:
- A public interactive browser demo and a Netlify-hosted demo API.
- A separate Node.js API backend scaffold.
- HMAC-SHA256 webhook signature verification and timestamp-window checks.
- PostgreSQL schema and database-backed uniqueness for provider/event idempotency.
- A screening audit table and automated unit/integration tests.
- GitHub Actions deployment and verification workflows.

The public demo API and the separate PostgreSQL backend scaffold are not yet connected. The public demo uses temporary function memory; the separate backend scaffold is not publicly deployed.

## Current verification

- GitHub Pages deployment workflow has verified the public demo page.
- Automated API checks have successfully exercised ACCEPT, REVIEW, REJECT and DUPLICATE against the public demo endpoint.
- PostgreSQL-backed integration tests have passed in GitHub Actions.

These checks apply to synthetic data and the current prototype only. They do not establish production readiness, payment-provider integration, fraud-detection accuracy, regulatory certification, customer usage or commercial traction.

## Limitations

NEXORA Payment Integrity is not a payment processor, bank integration, production fraud-detection system or certified financial control. It does not connect to real bank or payment-provider accounts and must not receive real payment or personal data. The rules are deterministic, not machine learning. No paying customers, revenue or production usage are claimed.

The wider NEXORA community, marketplace, rewards and AI-assisted business areas remain interactive concept prototypes. They do not yet provide production accounts, shared persistence, live AI connectivity or monetary rewards.

## Proposed next step

The immediate objective is to validate one narrow use case with payment operations or software businesses, identify a consenting design partner, and define a scoped MVP with measurable acceptance criteria. Any pilot using real data would require a secured deployment, provider-specific integration, independent security/privacy review and appropriate legal/compliance review.

## What we are seeking

NEXORA is seeking:
- Technical feedback from payment operations and fintech teams.
- Introductions to potential design partners for customer discovery.
- Guidance on a suitable early-stage startup or innovation support route.
- A discussion about a narrowly scoped prototype/pilot, subject to technical and security review.
