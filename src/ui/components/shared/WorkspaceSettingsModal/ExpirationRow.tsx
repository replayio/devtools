import React from "react";
import { Subscription } from "ui/types";
import { formatDate } from "./formatDate";

export function ExpirationRow({ subscription }: { subscription: Subscription }) {
  if (subscription.plan.key.includes("beta") || !subscription.trialEnds) {
    return null;
  }

  let label = "Renewal date";

  if (subscription.status === "trialing" && subscription.paymentMethods.length === 0) {
    label = "Your team’s start date";
  } else if (subscription.status === "canceled") {
    label = "Subscription end date";
  }

  return (
    <div className="border-color-gray-50 flex flex-row items-center justify-between border-b py-2">
      <span>{label}</span>
      <span>{formatDate(subscription.trialEnds, "long")}</span>
    </div>
  );
}
