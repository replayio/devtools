import React from "react";
import { Subscription, Workspace } from "ui/types";
import MaterialIcon from "../MaterialIcon";
import { Banner } from "./Banner";
import { isSubscriptionCancelled } from "./utils";
import { formatDate } from "./formatDate";

export function BillingBanners({
  confirmed,
  workspace,
  onResubscribe,
}: {
  confirmed?: boolean;
  workspace: Workspace;
  onResubscribe: () => void;
}) {
  const subscription = workspace.subscription;

  if (confirmed) {
    return (
      <Banner icon={<MaterialIcon iconSize="xl">check_circle_outline</MaterialIcon>} type="primary">
        Payment method added successfully, thank you!
      </Banner>
    );
  }

  if (subscription?.plan.key === "beta-v1") {
    return (
      <Banner icon={<span className="text-3xl">😍</span>} type="primary">
        We’ve gifted you a team plan for being a beta tester. Thank you!
      </Banner>
    );
  }

  if (subscription?.status === "trialing") {
    return (
      <Banner icon={<MaterialIcon iconSize="xl">access_time</MaterialIcon>} type="warning">
        Trial ends {formatDate(subscription.trialEnds!)}
      </Banner>
    );
  }

  if (subscription && isSubscriptionCancelled(subscription)) {
    const past = Date.now() - new Date(subscription.effectiveUntil!).getTime() > 0;
    return (
      <Banner icon={<MaterialIcon iconSize="xl">access_time</MaterialIcon>} type="warning">
        {past ? (
          <div className="flex flex-row justify-between">
            <span>Subscription expired</span>
            <button className="text-black underline" onClick={onResubscribe}>
              {workspace.hasPaymentMethod ? "Resume Subscription" : "Add payment method"}
            </button>
          </div>
        ) : (
          `Subscription ends ${formatDate(subscription.effectiveUntil!)}.`
        )}
      </Banner>
    );
  }

  return null;
}
