# NEXORA — Achmea Impact Ventures Problem Card (working draft)

**Status:** Founder-review draft — not an application and not submitted  
**Prepared:** 12 November 2026  
**Founder:** Sebastian Moczygemba  
**Location:** Netherlands  
**Project status:** Independent, solo-founder project; not incorporated

## 1. The problem we want to investigate

Digital businesses increasingly rely on payment providers and software integrations to tell them whether a payment-related event has occurred. The initial problem hypothesis is that smaller online merchants and digital platforms can lack a simple, consistent way to validate incoming payment-status notifications, detect duplicate or replayed events, and retain a clear record of how uncertain events were handled.

When event handling is inconsistent, a business may face operational confusion: an order could be treated as paid more than once, a valid event could be missed, or staff may have to investigate unclear payment-status changes manually. The scale, frequency and financial impact of these problems for a specific Dutch customer segment have **not yet been measured or validated by NEXORA**.

## 2. Who may experience the problem?

**Initial customer hypothesis:** Dutch small and medium-sized online merchants, SaaS platforms and digital businesses that receive payment-status events from one or more payment service providers.

**Potential buyer / decision-maker:** founder, head of operations, finance lead or technical lead responsible for payment operations and integrations.

This segment is provisional. NEXORA has not yet completed structured customer interviews and has not confirmed which buyer experiences the most urgent pain or controls the budget.

## 3. Proposed solution

NEXORA Payment Integrity is an early, provider-neutral validation layer for incoming payment-event notifications.

The intended product would:
- validate the authenticity and basic integrity of incoming event messages;
- identify duplicate or potentially replayed events;
- apply transparent rules to route events to ACCEPT, REVIEW or REJECT;
- keep an auditable record explaining the decision;
- eventually offer a simple API and operational dashboard for a selected customer segment.

The goal is not to process or move money, replace a payment service provider, or claim to detect all fraud. It is to help a business handle payment-related event notifications more consistently and transparently.

## 4. What exists today

A public demonstrator uses **synthetic event data** and shows ACCEPT, REVIEW, REJECT and DUPLICATE outcomes.

A separate Node.js/PostgreSQL backend scaffold explores HMAC-SHA256 request authentication, timestamp checks, idempotency and audit-record structure.

**Important technical limitation:** the public demonstrator and the separate backend scaffold are not yet connected into one deployed product. There are no live bank or payment-provider integrations, no production deployment, no live payment data, no paying customers and no revenue. The current demonstrator is not a production fraud-detection system and does not use a live AI/ML model.

- Project overview: https://bnexora7-eng.github.io/nexora-business/company/
- Demonstrator: https://bnexora7-eng.github.io/nexora-business/payment-integrity-demo/demo.html
- Source repository: https://github.com/bnexora7-eng/nexora-business

## 5. Why this could matter

If validated, a lightweight and explainable event-validation layer could reduce avoidable manual investigation and improve operational clarity for businesses that depend on payment notifications.

These are **intended outcomes, not measured results**. NEXORA currently has no customer evidence demonstrating reduced losses, fewer errors, faster reconciliation or improved fraud prevention.

## 6. Business model hypothesis

A possible model is recurring B2B SaaS/API subscription, with pricing based on event volume, number of integrations and operational features. A paid onboarding or integration service may be considered where justified.

No pricing has been tested. There are no signed customers, paid pilots, revenue, validated willingness-to-pay data or unit economics.

## 7. First validation plan

The first milestone should be customer discovery, not further feature expansion.

1. Interview 15–20 Dutch online merchants, SaaS/platform operators and payment-operations professionals.
2. Ask for recent examples of duplicate, delayed, replayed or ambiguous payment events and how teams currently investigate them.
3. Quantify frequency, time spent, financial exposure and current tools where interviewees can provide evidence.
4. Identify the single buyer and use case with the strongest urgency and willingness to pay.
5. Test a clickable or API-based workflow with 2–3 design partners using sandbox or synthetic data.
6. Define measurable pilot outcomes before making any claims about operational or financial improvement.

The initial go/no-go question is whether a clearly defined Dutch customer segment has a recurring, costly problem that it will pay to solve.

## 8. Why approach Achmea Impact Ventures?

NEXORA may be relevant to the **healthy finances (outside insurance)** focus area if customer discovery confirms that payment-event integrity is a meaningful financial-operations problem for a defined customer group.

That fit is not assumed. We are asking Achmea Impact Ventures to assess whether the problem is within its investment scope and whether its research, product, engineering and commercial expertise could help validate the opportunity and build a focused venture.

The ambition is to build an independent, scalable business with customers beyond Achmea. The venture must not depend on exclusive access to Achmea or on a policy change.

## 9. Founder and commitment

NEXORA is currently being developed by Sebastian Moczygemba as an independent, solo-founder project in the Netherlands. The founder initiated the project recently and has taken the first steps to define the proposition, build a demonstrator and publish project materials.

A complete professional CV and a fuller account of relevant domain experience should be supplied separately; this draft does not claim prior fintech-company leadership, a previous startup exit or a shipped production product.

Achmea's published programme expects a founder to commit full-time and work with its team in Amsterdam for part of the week. The founder's ability to meet those specific availability and location expectations has **not yet been confirmed** and must be discussed honestly before any formal application.

## 10. What we are asking for

An initial conversation to determine:
- whether this problem and proposed customer segment fit Achmea Impact Ventures' healthy-finances focus;
- whether the idea is sufficiently specific for the Idea / venture-building route;
- what customer evidence Achmea would expect before progressing;
- whether the founder's current stage and availability could fit the programme.

We are not presenting this as a funding application with validated traction. We are asking for a candid assessment and, if there is a fit, a structured route to validate the problem and build the first focused product.

---

## Internal readiness checklist — do not send as claims

- [ ] Complete a truthful founder CV / short bio.
- [ ] Confirm whether full-time commitment is realistic.
- [ ] Confirm willingness and practical ability to work in Amsterdam part of the week.
- [ ] Conduct and document customer interviews; do not invent interview results.
- [ ] Identify a specific customer segment, buyer and budget owner.
- [ ] Quantify the problem using evidence from interviews or reliable data.
- [ ] Test willingness to pay and refine the business model.
- [ ] Confirm Achmea's current application route and required Problem Card format.

## Source notes

Achmea's published Founder / Idea information says that an MVP, complete team and extensive business plan are not mandatory at the initial stage, but founders should understand the problem, target group and potential payer, have spoken to potential customers, be willing to test assumptions, commit full-time and work part of the week with the Amsterdam team. Its focus areas include health, healthy finances outside insurance, sustainability, work, housing and mobility.

Official programme information:
- https://www.achmea-impact.ventures/en/idea/
- https://achmeainnovationhub.recruitee.com/o/founder-algemeen
