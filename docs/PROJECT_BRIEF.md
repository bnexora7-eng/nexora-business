# NEXORA BUSINESS — Project Brief

**Status:** Early-stage, pre-production prototype  
**Project location:** Netherlands  
**Repository:** https://github.com/bnexora7-eng/nexora-business  
**Interactive Payment Integrity demo:** https://bnexora7-eng.github.io/nexora-business/payment-integrity-demo/demo.html  
**Project information:** https://bnexora7-eng.github.io/nexora-business/company/  
**Sandbox API health:** https://nexora-payment-integrity-api.onrender.com/health

## Overview

NEXORA is a founder-led digital product project. Its first focused technical workstream, **NEXORA Payment Integrity**, explores screening simulated payment-event notifications and returning explainable ACCEPT, REVIEW or REJECT decisions while identifying duplicate event identifiers.

The current public sandbox uses synthetic data and deterministic rules. It is intended for technical discussion and early customer discovery, not live financial operations.

## What can be evaluated now

- Submit a synthetic payment event through the interactive browser demo.
- See ACCEPT, REVIEW or REJECT decisions with an explanation.
- Exercise duplicate-event detection in backend tests.
- Review the browser session's illustrative event log.
- Inspect the public sandbox API health endpoint.

The latest automated GitHub Actions run verified the public site, API decisions, and browser rendering of ACCEPT, REVIEW and REJECT. Backend checks also verified DUPLICATE. These checks apply only to the current synthetic-data demonstration.

## Engineering work completed

The repository contains:
- A public interactive browser demo hosted on GitHub Pages.
- A separate demo API hosted on Render.
- A Node.js backend scaffold with provider HMAC-SHA256 signature verification and timestamp-window checks.
- PostgreSQL schema and database-backed uniqueness for provider/event idempotency.
- Screening audit-related tables and automated unit/integration tests.
- GitHub Actions deployment and browser/API verification workflows.

The public demo API and the separate PostgreSQL backend scaffold are not yet connected as one production service. The demo uses temporary storage; it is not a durable production audit trail.

## Limitations

NEXORA Payment Integrity is not a payment processor, bank integration, production fraud-detection system or certified financial control. It does not connect to real bank or payment-provider accounts and must not receive real payment or personal data. The rules are deterministic, not machine learning. No paying customers, revenue or production usage are claimed.

The wider NEXORA community, marketplace, rewards and AI-assisted business areas remain pre-production modules with partial backend functionality. Paid operations such as publishing, Business workspace access and AI planning are gated by the All Access entitlement check; public Community and Marketplace reads remain previews. Live AI connectivity and monetary rewards are not yet ready for production. The intended membership model is one All Access subscription at €29.99/month; billing is not enabled until recurring payments are fully tested.

## Proposed next step

Validate one narrow payment-operations use case with potential design partners. Identify a consenting design partner, document the workflow and pain point, and define a scoped MVP with measurable acceptance criteria. Any pilot using real data would require a secured unified deployment, provider-specific integration, independent security/privacy review and appropriate legal/compliance review.

## What we are seeking

NEXORA is seeking:
- Technical feedback from payment operations and software teams.
- Introductions to potential design partners for customer discovery.
- Guidance on a suitable early-stage startup or innovation support route.
- A discussion about a narrowly scoped prototype/pilot, subject to technical and security review.
