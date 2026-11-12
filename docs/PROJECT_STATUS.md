# NEXORA BUSINESS — Master Project Status

**Last updated:** 12 November 2026  
**Project owner:** NEXORA BUSINESS  
**Repository:** https://github.com/bnexora7-eng/nexora-business

## Canonical project links

- Interactive Payment Integrity demo: https://splendid-lokum-02523e.netlify.app/
- Project/company information: https://bnexora7-eng.github.io/nexora-business/company/
- Source code: https://github.com/bnexora7-eng/nexora-business
- Consolidated external-facing brief: https://github.com/bnexora7-eng/nexora-business/blob/main/docs/PROJECT_BRIEF.md

## Current status

NEXORA Payment Integrity is a working **pre-production demonstration prototype**. It is suitable for demonstrations, technical feedback, early partner conversations and customer discovery. It is not a production payment or banking product.

### Verified in the project work on 12 November 2026

- The public Netlify demo endpoint was exercised by automated checks for ACCEPT, REVIEW, REJECT and DUPLICATE.
- The GitHub Pages deployment workflow passed.
- PostgreSQL-backed integration tests passed in GitHub Actions.
- The browser demo is publicly accessible at the canonical demo link above.

Relevant recorded GitHub Actions run:
https://github.com/bnexora7-eng/nexora-business/actions/runs/43143271001

## Product scope

The first workstream screens synthetic payment-event notifications and returns deterministic ACCEPT, REVIEW or REJECT decisions, including duplicate-event detection.

The repository also contains a separate backend scaffold with webhook signature verification, timestamp-window checks, PostgreSQL schema/idempotency and audit-related code.

## Important limitations — do not overstate readiness

- No live bank or payment-provider connections.
- No real payment processing.
- No production fraud-detection service; current decisions are deterministic rules, not a validated machine-learning model.
- The public demo endpoint and the separate PostgreSQL backend scaffold are not yet connected as one production service.
- Do not submit real personal, banking or payment data to the demo.
- No production security/compliance certification, paying customers, revenue or commercial traction is claimed.
- Wider NEXORA marketplace/community/AI concepts remain concept prototypes unless separately implemented and verified.

## External outreach

On 12 November 2026, follow-up messages with the demo, source repository and project brief were sent in existing email threads to:
- Brainport for SMEs
- Brainport Development
- Techleap
- BOM
- Brabant Startup Fund
- ABN AMRO Innovation
- Buckaroo
- PAY.

This records that messages were sent; it does not imply that any organization has replied, endorsed the project, offered funding or agreed to partner.

## Google for Startups

A prior Google for Startups application/support request received an automated acknowledgement. It is not an approval or funding commitment. The project still needs to resolve the business-domain email and billing-account requirements before treating the application as complete.

## Next actions — in order

1. Keep this status file and PROJECT_BRIEF.md updated after every material code or deployment change.
2. Confirm the live demo and latest deployment workflow after any new release.
3. Secure a suitable business domain and domain-based email if pursuing the Google for Startups route.
4. Continue partner follow-up and request technical feedback/design-partner discussions.
5. Before any real-data pilot, connect and deploy the backend properly, implement provider-specific integrations, and complete independent security, privacy and legal/compliance review.

## Continuity rule

When resuming work, start with this file, then inspect the current main branch and latest GitHub Actions runs. Do not assume an old deployment, test result, or external application status is still current without rechecking it.


## ABN AMRO funding proposal — 12 November 2026

- Created proposal: [docs/ABN_AMRO_FUNDING_PROPOSAL.md](ABN_AMRO_FUNDING_PROPOSAL.md)
- Sent a follow-up to ABN AMRO Innovation at dareinnovation@nl.abnamro.com in the existing NEXORA email thread.
- Requested €10,000 in early-stage development support, preferably sponsorship or pilot-development contribution; also requested referral to the suitable startup/innovation funding route.
- The message explicitly states that NEXORA is a pre-production prototype, not a live payment/banking product, and that this is not a formal standard-loan application.
- **Status:** sent; no approval or reply is implied. Await ABN AMRO's response.
