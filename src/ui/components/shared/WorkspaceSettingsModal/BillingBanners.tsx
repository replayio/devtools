import React from "react";
import { Subscription } from "ui/types";
import { getFeatureFlag } from "ui/utils/launchdarkly";
import MaterialIcon from "../MaterialIcon";
import { Banner } from "./Banner";
import { isSubscriptionCancelled } from "./utils";
import { formatDate } from "./formatDate";

export function BillingBanners({
  confirmed,
  subscription,
}: {
  confirmed?: boolean;
  subscription: Subscription;
}) {
  if (confirmed) {
    return (
      <Banner icon={<MaterialIcon>check_circle_outline</MaterialIcon>} type="primary">
        Payment method added successfully, thank you!
      </Banner>
    );
  }

  if (subscription.plan.key === "beta-v1") {
    return (
      <Banner icon={<span className="text-3xl">😍</span>} type="primary">
        We’ve gifted you a team plan for being a beta tester. Thank you!
      </Banner>
    );
  }

  if (isSubscriptionCancelled(subscription)) {
    return (
      <Banner icon={<MaterialIcon>access_time</MaterialIcon>} type="warning">
        Subscription ends {formatDate(subscription.effectiveUntil!)}
      </Banner>
    );
  }

  return null;
}
