import { PaymentMethod, PlanPricing, Subscription, SubscriptionWithPricing } from "ui/types";

export type Views =
  | "details"
  | "trial-details"
  | "add-payment-method"
  | "enter-payment-method"
  | "confirm-payment-method"
  | "delete-payment-method";

export function isSubscriptionCancelled(subscription: Subscription) {
  return subscription.status === "canceled" && subscription.effectiveUntil;
}

export const isTrial = (subscription: Subscription): boolean => {
  return subscription.status === "trialing" && subscription.paymentMethods.length === 0;
};

export function formatPaymentMethod(paymentMethod: PaymentMethod) {
  return `${cardToDisplayType(paymentMethod.card.brand)} ending with ${paymentMethod.card.last4}`;
}

export const cardToDisplayType = (type: string) => {
  switch (type) {
    case "visa":
      return "Visa";
    case "amex":
      return "American Express";
    case "diners":
      return "Diners Club";
    case "jcb":
      return "JCB";
    case "mastercard":
      return "Mastercard";
    default:
      return "Card";
  }
};

export const pricingDetailsForSubscription = (subscription: Subscription): PlanPricing => {
  switch (subscription.plan.key) {
    case "beta-v1":
    case "test-beta-v1":
      return {
        billingSchedule: null,
        displayName: "Beta Tester Appreciation",
        seatPrice: 0,
        trial: isTrial(subscription),
      };
    case "team-v1":
    case "test-team-v1":
      return {
        billingSchedule: "monthly",
        displayName: "Team",
        seatPrice: 20,
        trial: isTrial(subscription),
      };
    case "team-annual-v1":
      return {
        billingSchedule: "annual",
        displayName: "Team",
        seatPrice: 220,
        trial: isTrial(subscription),
      };
    case "org-v1":
      return {
        billingSchedule: "monthly",
        displayName: "Organization",
        seatPrice: 75,
        trial: isTrial(subscription),
      };
    case "org-annual-v1":
      return {
        billingSchedule: "annual",
        displayName: "Organization",
        seatPrice: 825,
        trial: isTrial(subscription),
      };
    case "ent-v1":
      return {
        billingSchedule: "contract",
        displayName: "Enterprise Contract",
        seatPrice: 0,
        trial: false,
      };
  }
};

export const getSubscriptionWithPricing = (subscription: Subscription): SubscriptionWithPricing => {
  return { ...subscription, ...pricingDetailsForSubscription(subscription) };
};

export const cycleCharge = (planPricing: SubscriptionWithPricing): number => {
  if (!planPricing.billingSchedule) {
    return 0;
  }

  return planPricing.seatPrice * planPricing.seatCount;
};
