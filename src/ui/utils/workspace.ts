import { Workspace, WorkspaceSubscriptionStatus } from "ui/types";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";

export function inUnpaidFreeTrial(workspace: Workspace) {
  const subscription = workspace.subscription;

  if (subscription && subscription.status === "trialing") {
    return !workspace.hasPaymentMethod;
  }

  return false;
}

export function subscriptionEndsIn(workspace: Workspace, date?: Date | number) {
  date = date || Date.now();
  const subscription = workspace.subscription;

  if (!subscription) {
    return Infinity;
  }

  if (
    subscription.status === WorkspaceSubscriptionStatus.Canceled ||
    subscription.status === WorkspaceSubscriptionStatus.Incomplete
  ) {
    return differenceInCalendarDays(new Date(subscription.effectiveUntil), date);
  }

  if (subscription.status === WorkspaceSubscriptionStatus.Active) {
    return !workspace.hasPaymentMethod
      ? differenceInCalendarDays(new Date(subscription.effectiveUntil), date)
      : Infinity;
  }

  return differenceInCalendarDays(new Date(subscription.trialEnds!), date);
}

export function subscriptionExpired(workspace: Workspace, date?: Date) {
  const expiresIn = subscriptionEndsIn(workspace, date);

  return expiresIn < 0;
}

export function decodeWorkspaceId(workspaceId: string | null) {
  if (!workspaceId) {
    return workspaceId;
  }

  // The first element will be the prefix, i.e. "w:then-the-uuid"
  const [_, uuid] = workspaceId.split(":", 2);
  return uuid;
}
