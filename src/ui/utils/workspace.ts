import { Subscription } from "ui/types";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";

export function inUnpaidFreeTrial(subscription?: Subscription) {
  return (
    subscription &&
    subscription.status == "trialing" &&
    (!subscription.paymentMethods || subscription.paymentMethods.length === 0)
  );
}

export function freeTrialExpiresIn(subscription: Subscription) {
  return differenceInCalendarDays(new Date(subscription.trialEnds), Date.now());
}

export function freeTrialExpired(subscription?: Subscription) {
  if (!subscription || !inUnpaidFreeTrial(subscription)) {
    return false;
  }
  const expiresIn = freeTrialExpiresIn(subscription);
  return expiresIn <= 0;
}
