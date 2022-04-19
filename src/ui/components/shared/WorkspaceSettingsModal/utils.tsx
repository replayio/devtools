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
  return (
    subscription.status === "trialing" &&
    subscription.paymentMethods != null &&
    subscription.paymentMethods.length === 0
  );
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
        discount: 0,
        displayName: "Beta Tester Appreciation",
        seatPrice: 0,
        trial: isTrial(subscription),
      };
    case "team-v1":
    case "test-team-v1":
      return {
        billingSchedule: "monthly",
        discount: 0,
        displayName: "Team",
        seatPrice: 20,
        trial: isTrial(subscription),
      };
    case "team-annual-v1":
      return {
        billingSchedule: "annual",
        discount: 0.1,
        displayName: "Team",
        seatPrice: 20,
        trial: isTrial(subscription),
      };
    case "org-v1":
      return {
        billingSchedule: "monthly",
        discount: 0,
        displayName: "Organization",
        seatPrice: 75,
        trial: isTrial(subscription),
      };
    case "org-annual-v1":
      return {
        billingSchedule: "annual",
        discount: 0.1,
        displayName: "Organization",
        seatPrice: 75,
        trial: isTrial(subscription),
      };
    case "ent-v1":
      return {
        billingSchedule: "contract",
        discount: 0,
        displayName: "Enterprise",
        seatPrice: 0,
        trial: false,
      };
  }
};

export const getSubscriptionWithPricing = (subscription: Subscription): SubscriptionWithPricing => {
  return { ...subscription, ...pricingDetailsForSubscription(subscription) };
};

const monthsPerCycle = (planPricing: SubscriptionWithPricing): number => {
  return planPricing.billingSchedule === "annual" ? 12 : 1;
};

const calcSubtotal = (planPricing: SubscriptionWithPricing): number => {
  if (!planPricing.billingSchedule) {
    return 0;
  }

  return planPricing.seatPrice * planPricing.seatCount * monthsPerCycle(planPricing);
};

export const cycleDiscount = (planPricing: SubscriptionWithPricing): string => {
  if (!planPricing.billingSchedule) {
    return formatCurrency(0);
  }

  return formatCurrency(-1 * calcSubtotal(planPricing) * planPricing.discount);
};

export const cycleSubtotal = (planPricing: SubscriptionWithPricing): string => {
  return formatCurrency(calcSubtotal(planPricing));
};

export const cycleCharge = (planPricing: SubscriptionWithPricing): string => {
  return formatCurrency(calcSubtotal(planPricing) * (1 - planPricing.discount));
};

export function formatCurrency(amount: number) {
  const formatter = new Intl.NumberFormat("en-us", { currency: "USD", style: "currency" });
  return formatter.format(amount);
}

export function formatPercentage(amount: number) {
  const formatter = new Intl.NumberFormat("en-us", { style: "percent" });
  return formatter.format(amount);
}
