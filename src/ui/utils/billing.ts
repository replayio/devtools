import { Subscription } from "ui/types";

export type BillingSchedule = "annual" | "monthly";

export interface PlanPricing {
  billingSchedule: BillingSchedule;
  seatPrice: number;
}

export const fullPricingDetailsForSubscription = (
  subscription: Subscription
): Subscription & PlanPricing => {
  if (subscription.plan.key === "team-v1") {
    return {
      ...subscription,
      billingSchedule: "monthly",
      seatPrice: 20,
    };
  } else if (subscription.plan.key === "org-v1") {
    return {
      ...subscription,
      billingSchedule: "monthly",
      seatPrice: 75,
    };
  }
  throw `Don't know how to calculate pricing details for subscription with ID: ${subscription.id}`;
};

export const cycleCharge = (planPricing: Subscription & PlanPricing): number => {
  let monthsPerCycle = 1;
  if (planPricing.billingSchedule === "annual") {
    monthsPerCycle = 12;
  }
  return monthsPerCycle * planPricing.seatPrice * planPricing.seatCount;
};
