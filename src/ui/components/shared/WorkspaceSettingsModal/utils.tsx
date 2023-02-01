import { assert } from "protocol/utils";
import {
  PaymentMethod,
  PlanPricing,
  Subscription,
  SubscriptionWithPricing,
} from "shared/graphql/types";

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
  assert(subscription.plan?.key, "Workspace does not have a planKey");
  switch (subscription.plan.key) {
    case "beta-v1":
    case "test-beta-v1":
      return {
        billingSchedule: null,
        displayName: "Beta Tester Appreciation",
        seatPrice: 0,
        discount: 0,
        trial: isTrial(subscription),
      };
    case "team-oss-v1":
      return {
        billingSchedule: "monthly",
        displayName: "OSS Team",
        seatPrice: 0,
        discount: 0,
        trial: false,
      };
    case "team-internal-v1":
      return {
        billingSchedule: "monthly",
        displayName: "Replay Team",
        seatPrice: 0,
        discount: 0,
        trial: false,
      };
    case "team-v1":
    case "test-team-v1":
      return {
        billingSchedule: "monthly",
        displayName: "Team",
        seatPrice: 20,
        discount: 0,
        trial: isTrial(subscription),
      };
    case "team-annual-v1":
      return {
        billingSchedule: "annual",
        displayName: "Team",
        seatPrice: 20,
        discount: 0.1,
        trial: isTrial(subscription),
      };
    case "org-v1":
      return {
        billingSchedule: "monthly",
        displayName: "Organization",
        seatPrice: 75,
        discount: 0,
        trial: isTrial(subscription),
      };
    case "org-annual-v1":
      return {
        billingSchedule: "annual",
        displayName: "Organization",
        seatPrice: 75,
        discount: 0.1,
        trial: isTrial(subscription),
      };
    case "org-annual-contract-v1":
      return {
        billingSchedule: "contract",
        displayName: "Organization",
        seatPrice: 0,
        discount: 0,
        trial: false,
      };
    case "ent-v1":
      return {
        billingSchedule: "contract",
        displayName: "Enterprise",
        seatPrice: 0,
        discount: 0,
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
  if (!planPricing.billingSchedule || !planPricing.seatCount) {
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
  const formatter = new Intl.NumberFormat("en-us", { style: "currency", currency: "USD" });
  return formatter.format(amount);
}

export function formatPercentage(amount: number) {
  const formatter = new Intl.NumberFormat("en-us", { style: "percent" });
  return formatter.format(amount);
}

const extractUrlParts = new RegExp(
  "^" +
    // protocol
    "([^:/?#.]+:)" +
    "//" +
    // domain - adapted from https://stackoverflow.com/questions/3117218/matching-url-with-wildcards
    // full supported list https://www.icann.org/en/system/files/files/idna-protocol-2003-2008.txt
    "([*\\w\\d\\-\\u0100-\\uffff.%]*)" +
    // port
    "(?::([*0-9]+))?",
  "u"
);

export function sanitizeUrlList(input: string) {
  return input
    .split(",")
    .map(s => s.trim())
    .map(v => {
      try {
        const [, protocol, hostname, port] = v.match(extractUrlParts) || [];

        if (!protocol || !hostname) {
          return "";
        }

        return `${protocol}//${hostname}${port ? ":" + port : ""}`;
      } catch {
        return "";
      }
    })
    .filter(Boolean);
}
