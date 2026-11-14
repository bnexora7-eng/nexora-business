# NEXORA BUSINESS — ABN AMRO Funding & Innovation Support Proposal

**Date:** 12 November 2026  
**Funding sought:** €10,000 (indicative first-stage development budget)  
**Stage:** Working pre-production prototype  
**Prepared for:** ABN AMRO — Innovation / Digital Banking / Startup Partnerships

## 1. Executive summary

NEXORA Payment Integrity is an early-stage software project exploring a way to screen payment-event notifications and flag events for acceptance, review or rejection. The current demonstration uses synthetic data and deterministic rules. It is intended to support early technical evaluation and discovery of a suitable pilot use case.

NEXORA is seeking **€10,000 in early-stage development support**, preferably as innovation sponsorship, a pilot-development contribution, or another suitable startup-support arrangement. If direct financial support is not available, NEXORA would value a referral to the appropriate ABN AMRO innovation, startup or external funding programme.

This is an exploratory request for a discussion, not a representation that NEXORA currently qualifies for a standard business loan.

## 2. What exists today

- A publicly accessible interactive demonstration: https://bnexora7-eng.github.io/nexora-business/payment-integrity-demo/demo.html
- A source repository and project documentation: https://github.com/bnexora7-eng/nexora-business
- A separate technical backend scaffold covering webhook-signature verification, timestamp checks, PostgreSQL schema, idempotency and audit-related functionality.
- Automated checks recorded in GitHub Actions, including synthetic ACCEPT, REVIEW, REJECT and DUPLICATE scenarios.
- A project brief: https://github.com/bnexora7-eng/nexora-business/blob/main/docs/PROJECT_BRIEF.md

## 3. Proposed use of €10,000

The following is an indicative planning budget, to be refined with a technical partner and quotations.

| Workstream | Indicative amount |
|---|---:|
| Backend completion and deployment architecture | €3,000 |
| Payment-provider integration design and sandbox implementation | €2,000 |
| Security hardening, privacy engineering and independent review | €1,500 |
| Pilot preparation, test coverage and technical documentation | €1,500 |
| Product validation, user research and implementation contingency | €1,000 |
| Company setup, legal and compliance scoping | €1,000 |
| **Total** | **€10,000** |

No part of this budget is presented as a supplier quote or an already incurred expense. A detailed milestone budget would be agreed before any funding is accepted or spent.

## 4. Proposed milestones

**Milestone 1 — Scope and architecture:** agree one narrowly defined use case, threat model, data boundaries and pilot success criteria.

**Milestone 2 — Technical MVP:** connect the backend to a selected provider sandbox, complete persistent event handling and implement monitoring and audit controls.

**Milestone 3 — Independent review:** conduct security, privacy and legal/compliance scoping before any real customer or payment data is considered.

**Milestone 4 — Controlled pilot readiness:** prepare a documented, sandbox-only pilot and report measured results to the partner.

The timeline and acceptance criteria would be agreed with the selected partner. No live payment processing is proposed under this initial request.

## 5. Current limitations and risk controls

NEXORA is **not a production banking system, payment processor or validated fraud-detection service**. It does not currently process real payments or connect to live bank/payment-provider systems. The public demo uses synthetic data and deterministic decision rules. The separate backend scaffold is not yet integrated with the public demo as a production service.

No real personal, banking or payment data should be submitted to the public demonstration. Any future pilot involving real data would require appropriate technical integration, security testing, privacy review, legal/compliance assessment and partner approval.

## 6. What we are asking ABN AMRO

We would welcome one of the following:

1. Consideration of a €10,000 innovation sponsorship or pilot-development contribution;
2. A conversation with the relevant innovation or startup team about a small, controlled technical pilot;
3. Guidance or referral to an appropriate ABN AMRO, New10, RVO, Brainport or other early-stage funding route;
4. Technical feedback on the use case and the requirements NEXORA would need to meet before a pilot could be considered.

We understand that a conventional business loan may require formal business registration, trading history, financial statements and other eligibility checks. We are therefore asking first for guidance on the most suitable route for a project at prototype stage.

## 7. Links for evaluation

- **Live synthetic-data demo:** https://bnexora7-eng.github.io/nexora-business/payment-integrity-demo/demo.html
- **Source repository:** https://github.com/bnexora7-eng/nexora-business
- **Project brief:** https://github.com/bnexora7-eng/nexora-business/blob/main/docs/PROJECT_BRIEF.md
- **Project status and verification notes:** https://github.com/bnexora7-eng/nexora-business/blob/main/docs/PROJECT_STATUS.md

## 8. Contact and next step

We would appreciate a short online meeting or a written referral to the right team. We can provide a focused walkthrough of the current prototype and discuss a realistic, measurable first pilot.

**NEXORA BUSINESS**  
Project contact: bnexora7@gmail.com
