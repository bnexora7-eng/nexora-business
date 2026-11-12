export type PlanCode = "premium_monthly" | "business_monthly";

export type SubscriptionState =
  | "inactive"
  | "pending"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired"
  | "refunded";

export type PaymentProvider = "google_play" | "approved_web_provider";

export interface ProductPlan {
  code: PlanCode;
  displayName: string;
  billingPeriod: "month";
  priceMinorUnits: number | null;
  currency: string | null;
  available: boolean;
}

export interface SubscriptionEntitlement {
  userId: string;
  planCode: PlanCode;
  state: SubscriptionState;
  provider: PaymentProvider | null;
  currentPeriodEndsAt: string | null;
}

/**
 * Security boundary: these records are server-owned.
 * The mobile app must not create a verified payment or entitlement locally.
 * A backend must validate provider signatures, timestamps and idempotency
 * before updating subscription state or granting access.
 */
export interface VerifiedProviderEvent {
  provider: PaymentProvider;
  providerEventId: string;
  eventType: string;
  occurredAt: string;
  verifiedByServer: true;
}

export interface PayoutSummary {
  currency: string;
  grossAmountMinorUnits: number;
  refundsMinorUnits: number;
  providerFeesMinorUnits: number;
  taxWithheldMinorUnits: number;
  netPayableMinorUnits: number;
  payeeAccountVerified: boolean;
  payoutStatus: "not_configured" | "pending" | "paid" | "on_hold";
}

/**
 * Marketplace seller funds must be accounted for separately from NEXORA's
 * platform revenue. Never treat gross order value as founder income.
 */
export interface MarketplaceSettlement {
  orderId: string;
  sellerId: string;
  grossAmountMinorUnits: number;
  platformFeeMinorUnits: number;
  sellerNetMinorUnits: number;
  currency: string;
  settlementStatus: "pending" | "eligible" | "paid" | "refunded" | "disputed";
}
