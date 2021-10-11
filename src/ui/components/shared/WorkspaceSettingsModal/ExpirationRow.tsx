import React from "react";
import { Subscription } from "ui/types";
import { getFeatureFlag } from "ui/utils/launchdarkly";
import { formatDate } from "./formatDate";

export function ExpirationRow({
  subscription,
  label,
}: {
  label: string;
  subscription: Subscription;
}) {
  const showTrialExpiration = getFeatureFlag("ui-trial-expiration", false);

  if (subscription.plan.key.includes("beta") || !showTrialExpiration || !subscription.trialEnds) {
    return null;
  }

  return (
    <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
      <span>{label}</span>
      <span>{formatDate(subscription.trialEnds, "long")}</span>
    </div>
  );
}
