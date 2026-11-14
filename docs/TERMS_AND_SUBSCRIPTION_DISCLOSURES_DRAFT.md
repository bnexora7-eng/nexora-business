# NEXORA — Terms of Service and Subscription Disclosures (INTERNAL DRAFT)

**Status:** internal working draft only — NOT published, NOT accepted by users, and NOT legal advice.  
**Prepared:** 14 November 2026  
**Product:** NEXORA All Access, intended price €29.99 per month.

> Release blocker: do not publish these terms or enable paid checkout until every `[LEGAL REVIEW REQUIRED]` and `[OPERATOR INPUT REQUIRED]` item is resolved by the responsible operator and reviewed by a Dutch/EU consumer-law professional.

## 1. Operator and contact

- Legal name / registered business name: **[OPERATOR INPUT REQUIRED]**
- Legal form and country of establishment: **[OPERATOR INPUT REQUIRED]**
- KVK number (if established in the Netherlands): **[OPERATOR INPUT REQUIRED]**
- Registered postal address: **[OPERATOR INPUT REQUIRED]**
- VAT number and VAT treatment of the displayed price: **[OPERATOR INPUT REQUIRED]**
- Customer support email and expected response time: **[OPERATOR INPUT REQUIRED]**
- Legal notices / complaints contact: **[OPERATOR INPUT REQUIRED]**

NEXORA is a product/brand name and must not be presented as a separate legal person unless a legal entity has actually been established.

## 2. Scope and current availability

NEXORA is an evolving digital platform. Only features expressly marked as available in the current product release are included in the service. Features that are prototypes, demonstrations, disabled, under development or unavailable must be identified as such before a customer subscribes.

The Payment Integrity demonstration uses simulated events and illustrative deterministic rules. It is not a bank, payment institution, regulated payment service, certified fraud-detection system or guarantee that a transaction is safe. NEXORA does not move customer money or hold payment-card/bank login credentials.

Marketplace listings are currently listings/previews only. Unless a separate, verified checkout and dispute process is implemented and described, NEXORA is not the seller, escrow agent, payment intermediary or guarantor of transactions between users.

## 3. Account

- Account creation requires a valid email address and verification.
- Users must provide accurate account details and keep their credentials secure.
- Minimum age and parental/guardian rules: **[LEGAL REVIEW REQUIRED — set the actual eligibility policy and align the Play Console target audience]**.
- NEXORA may restrict access for security, abuse, unlawful use or material breach, subject to applicable consumer law and a fair process.

## 4. NEXORA All Access subscription

**Intended price:** €29.99 per month.  
**Billing interval:** monthly, recurring until canceled.  
**Taxes:** **[OPERATOR INPUT REQUIRED — confirm whether €29.99 is VAT-inclusive for each market and show the total payable before order confirmation]**.  
**Included features:** **[OPERATOR INPUT REQUIRED — publish a verified feature availability matrix; do not promise unfinished features]**.

Before a customer confirms an order, the checkout must prominently disclose the service, total price including applicable taxes, monthly renewal interval, payment method/provider, start date, cancellation method, any trial/introductory price and how/when the price may change.

No subscription is active merely because a user signs in or returns from a payment page. Access is granted only after the applicable payment provider confirms the transaction and the server reconciles the entitlement.

### 4.1 Website payments

Website checkout may use Mollie only after the operating business and subscription use have been accepted by Mollie, merchant onboarding is complete, test-mode lifecycle tests pass, and the legal/consumer disclosures and support process are ready. The customer must be shown the provider's recurring-payment terms and the NEXORA subscription terms before authorizing the first payment.

### 4.2 Android / Google Play payments

The Android app must not open Mollie checkout for a digital subscription unless NEXORA has completed the relevant Google Play EEA alternative-billing enrollment and implemented the required APIs, reporting, user disclosures, customer support and dispute process. Eligibility requires a registered business and is subject to Google Play's then-current terms and service fees.

Otherwise, implement Google Play Billing and server-side purchase verification. Do not assume website payment approval automatically authorizes in-app billing.

### 4.3 Renewal, cancellation and paid access

- Subscription renews monthly until canceled.
- Cancellation stops future renewals; access remains only through the paid-through date confirmed by the provider.
- The customer must be able to find the cancellation method without contacting support.
- Provider webhooks and server-side provider lookups, not browser redirects, determine paid status.
- Failed, refunded, disputed, canceled or expired transactions update entitlements according to provider state and the published policy.
- Do not delete an account while an unresolved recurring payment or subscription could continue charging the customer.

**Cancellation route and exact effective timing:** [LEGAL REVIEW REQUIRED — confirm the final website and Android customer journeys].

## 5. Consumer withdrawal, refunds and statutory rights

Consumers may have a statutory right to withdraw from a distance contract, commonly within 14 days under the Consumer Rights Directive, subject to the contract type and applicable exceptions. Do not insert a blanket “no refunds” term or require a user to waive statutory rights.

If the customer asks for a digital service to begin during a withdrawal period, the checkout must use the legally required express request/acknowledgment flow and provide the required confirmation. Whether and how any proportional payment is due on withdrawal, and any exception for digital content, must be assessed for the actual NEXORA service and Dutch implementation.

- Withdrawal instructions and model form: **[LEGAL REVIEW REQUIRED]**
- Refund policy and support contact: **[OPERATOR INPUT REQUIRED + LEGAL REVIEW REQUIRED]**
- Statutory conformity, updates and remedies for digital services: **[LEGAL REVIEW REQUIRED]**

## 6. User content and acceptable use

Users retain rights they hold in content they submit. They grant NEXORA only the limited license needed to host, display, secure and operate the selected feature. Public Community posts and Marketplace listings may be visible to other users. Users must not submit unlawful, infringing, deceptive, harmful or sensitive personal data they have no right to share.

NEXORA may remove content or restrict accounts where reasonably necessary for safety, legal compliance or these terms, while providing an appropriate notice/appeal process.

## 7. Privacy and data deletion

Personal data is handled under the NEXORA Privacy Policy: https://bnexora7-eng.github.io/nexora-business/privacy/

Users can request account deletion through the in-app profile or the public account-deletion page. Deletion removes the account and associated user content, subject to narrowly applicable legal retention duties. The privacy policy must identify the actual controller, processors, purposes, legal bases, retention periods, transfers and user rights before production launch.

## 8. Service availability, changes and liability

The service may be updated, interrupted or changed. Any material reduction in paid functionality, price change or contract change must be communicated and handled in accordance with applicable consumer law. Liability limitations, service suspension, force majeure and termination language require jurisdiction-specific legal review and must not remove mandatory consumer rights.

## 9. Governing law and dispute resolution

- Governing law: **[LEGAL REVIEW REQUIRED — Dutch law may apply, but mandatory consumer protections in the consumer's country remain relevant]**.
- Complaint handling and response times: **[OPERATOR INPUT REQUIRED]**.
- Consumer ADR / online dispute-resolution information: **[LEGAL REVIEW REQUIRED — verify current EU and Dutch requirements before publication]**.

## 10. Required release checks

- [ ] Registered operator identity, legal form, KVK and postal address confirmed.
- [ ] VAT registration/treatment and final €29.99 tax-inclusive display confirmed.
- [ ] Verified feature availability matrix attached to the offer.
- [ ] Terms and privacy policy reviewed by Dutch/EU counsel.
- [ ] Website checkout disclosures, recurring-payment consent and confirmation email verified.
- [ ] 14-day withdrawal / early-start consent / refund journey legally reviewed and tested.
- [ ] Cancellation journey tested from a normal user account.
- [ ] Customer support inbox, ownership and response process working.
- [ ] Android billing route selected: Play Billing OR approved EEA alternative-billing program.
- [ ] If EEA alternative billing is selected: business registration, Google enrollment, APIs, reporting, service fees, user disclosures, support and dispute handling verified.
- [ ] Marketplace role, seller responsibilities, content moderation and dispute boundaries reviewed.
- [ ] Public launch approved only after the above checks are documented.

## Official references to re-check before release

- EU Consumer Rights Directive 2011/83/EU, including withdrawal rights: https://eur-lex.europa.eu/eli/dir/2011/83/oj
- EU consumer rights summary: https://eur-lex.europa.eu/EN/legal-content/summary/consumer-information-right-of-withdrawal-and-other-consumer-rights.html
- Google Play EEA alternative billing eligibility and requirements: https://support.google.com/googleplay/android-developer/answer/12348241?hl=en
- Google Play Payments policy: https://support.google.com/googleplay/android-developer/answer/10281818?hl=en

These sources and program rules can change. Re-check the current versions at the time of release.
