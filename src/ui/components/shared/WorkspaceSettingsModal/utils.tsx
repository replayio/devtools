import { PaymentMethod, Subscription } from "ui/types";

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

export function getViewTitle(view: Views) {
  switch (view) {
    case "add-payment-method":
      return "Team Plan Pricing";
    case "enter-payment-method":
      return "Add Payment Method";
    case "confirm-payment-method":
      return "Payment Method Added!";
    case "delete-payment-method":
      return "Remove Payment Method";
  }
}
export function getPlanDisplayText(subscription: Subscription) {
  const trial = subscription.status === "trialing" && subscription.paymentMethods.length === 0;
  let text = "Team Plan";

  switch (subscription.plan.key) {
    case "beta-v1":
    case "test-beta-v1":
      text = "Beta Tester Appreciation Plan";
      break;
    case "team-v1":
    case "test-team-v1":
      text = "Team Plan";
      break;
  }

  return `${text} ${trial ? "(Trial)" : ""}`;
}
