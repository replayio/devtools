import { Workspace, WorkspaceSubscriptionStatus } from "ui/types";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";

export function inUnpaidFreeTrial(workspace: Workspace) {
  const subscription = workspace.subscription;
  return subscription && subscription.status == "trialing" && !workspace.hasPaymentMethod;
}

export function subscriptionEndsIn(workspace: Workspace, date?: Date | number) {
  const subscription = workspace.subscription;

  if (
    !subscription ||
    subscription.status === WorkspaceSubscriptionStatus.Canceled ||
    subscription.status === WorkspaceSubscriptionStatus.Incomplete
  ) {
    return 0;
  }

  if (subscription.status === WorkspaceSubscriptionStatus.Active) {
    // TODO: Use the following when effective_until is always populated
    // return !workspace.hasPaymentMethod ? subscription.effectiveUntil : Infinity;
    return Infinity;
  }

  return differenceInCalendarDays(new Date(subscription.trialEnds!), date || Date.now());
}

export function subscriptionExpired(workspace: Workspace, date?: Date) {
  const expiresIn = subscriptionEndsIn(workspace, date);

  return expiresIn <= 0;
}
