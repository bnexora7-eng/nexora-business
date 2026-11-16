# ALPINOSS BUSINESS — Project Brief

**Status:** Early-stage, pre-production prototype  
**Project location:** Netherlands  
**Repository:** https://github.com/bnexora7-eng/nexora-business  
**Interactive Payment Integrity demo:** https://bnexora7-eng.github.io/nexora-business/payment-integrity-demo/demo.html  
**Project information:** https://bnexora7-eng.github.io/nexora-business/company/  
**Sandbox API health:** https://nexora-payment-integrity-api.onrender.com/health

## Overview

ALPINOSS is the umbrella identity for an independent, multi-sector business initiative. This repository documents one current product-development workstream within that wider portfolio: **ALPINOSS Payment Integrity**, a prototype exploring screening simulated payment-event notifications and returning explainable ACCEPT, REVIEW or REJECT decisions while identifying duplicate event identifiers.

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

ALPINOSS Payment Integrity is not a payment processor, bank integration, production fraud-detection system or certified financial control. It does not connect to real bank or payment-provider accounts and must not receive real payment or personal data. The rules are deterministic, not machine learning. No paying customers, revenue or production usage are claimed.

The wider ALPINOSS community, marketplace, rewards and AI-assisted business areas remain pre-production modules with partial backend functionality. Accounts are free; private and write operations require authentication, not a paid membership. Public Community and Marketplace reads remain previews. Live AI connectivity and monetary rewards are not yet ready for production. The commercial model is one-time project fees after written scope and customer approval; there is no monthly membership or recurring platform fee. Payment checkout remains disabled until business, tax, provider and operational readiness are verified.

## Commercial model\n\nALPINOSS accounts are free. Indicative one-time project offers are €149 business analysis, €295 AI assistant prototype, €495 business-specific AI prototype, system integration from €950, €950–€2,500 multi-step automation, and €5,000–€15,000+ individually scoped enterprise work. These are indicative prices, not automatic checkout offers or guarantees of production readiness.\n\n## Proposed next step

Validate one narrow payment-operations use case with potential design partners. Identify a consenting design partner, document the workflow and pain point, and define a scoped MVP with measurable acceptance criteria. Any pilot using real data would require a secured unified deployment, provider-specific integration, independent security/privacy review and appropriate legal/compliance review.

## What we are seeking

ALPINOSS is seeking:
- Technical feedback from payment operations and software teams.
- Introductions to potential design partners for customer discovery.
- Guidance on a suitable early-stage startup or innovation support route.
- A discussion about a narrowly scoped prototype/pilot, subject to technical and security review.
