# NEXORA — Google for Startups application narrative (working draft)

**Status:** Internal preparation draft — not submitted  
**Updated:** 11 November 2026  
**Project repository:** https://github.com/bnexora7-eng/nexora-business  
**Public technical demo:** https://bnexora7-eng.github.io/nexora-business/payment-integrity-demo/demo.html

## Project summary

NEXORA is an early-stage technology project exploring practical tools for digital businesses. Its first technical workstream, **Payment Integrity**, is a provider-neutral prototype for screening payment-event notifications and returning explainable ACCEPT, REVIEW or REJECT decisions.

The prototype is designed to demonstrate a simple control layer between incoming payment-event data and downstream business workflows. It applies deterministic validation rules to synthetic event data, checks required identifiers and event status, and detects repeated provider/event identifiers.

## Problem hypothesis

Digital businesses can receive payment notifications from multiple systems in different formats and need reliable ways to validate event data, identify duplicate notifications and route uncertain events for review.

This is a problem hypothesis, not yet a validated market finding. NEXORA has not yet established customer demand, quantified losses, or confirmed willingness to pay. Customer discovery is a required next milestone.

## What has been built and tested

- Public interactive browser demo and public demo API.
- Health endpoint verified on the public API.
- Synthetic ACCEPT scenario successfully tested.
- Automated public API regression checks passed for REVIEW (pending event), REJECT (failed event) and DUPLICATE (same provider/event identifier submitted twice).
- Separate Node.js API backend scaffold includes HMAC-SHA256 request authentication, timestamp-window checks, PostgreSQL schema, database uniqueness for idempotency and an audit table.
- Automated unit and PostgreSQL-backed integration workflow is documented in the repository.

The public GitHub Pages demo and the separate PostgreSQL backend scaffold are not yet connected. The public demo uses temporary function memory and synthetic data. The separate backend scaffold is not publicly deployed.

## What makes the prototype useful to evaluate

The current demo makes the decision logic observable: a reviewer can submit a synthetic event and inspect the decision and explanation. The separate backend scaffold documents a path toward authenticated provider events, replay-window protection, persistent idempotency and audit records.

The project is at prototype stage. It does not use machine learning, connect to banks or payment processors, execute payments, or provide certified fraud detection. It has not processed live transactions and has no verified customers, revenue or production usage.

## Intended next milestones

1. Interview payment operations teams and software businesses to validate the problem and identify one narrow initial customer segment.
2. Select one real integration use case and define measurable acceptance criteria.
3. Deploy the separate authenticated API scaffold with managed PostgreSQL, secure secrets, monitoring and appropriate abuse controls.
4. Connect one test/sandbox payment provider only after customer and technical requirements are confirmed.
5. Conduct an independent security and privacy review before any live-data pilot.
6. Establish a pilot partner and measure operational outcomes before making performance claims.

## What support is being sought

The immediate request is for eligibility assessment and, if accepted, access to suitable startup support such as cloud credits, technical guidance and startup-program resources to develop and validate the MVP.

**This is a request for startup-program support, not a claim that Google is being asked to make an equity investment.** Cloud credits are not cash funding and are subject to Google's eligibility review and program terms.

## Facts that must be completed by the founder before any submission

- Legal entity name, country of registration and registration status (if applicable).
- Project/company founding date and evidence relevant to the program's age criteria.
- Founder and team biographies, roles and relevant experience.
- Exact first customer segment and evidence from customer interviews.
- Business model, pricing hypothesis and route to market.
- Funding history and planned fundraising timeline.
- Confirmed public website on a controlled domain and matching business email.
- Google Cloud Billing Account ID and billing-owner details, if required by the current application.

Do not submit this draft until every factual field has been reviewed and the current Google program eligibility requirements have been checked. Do not include passwords, API keys, database URLs or real customer/payment data.
