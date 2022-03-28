import React from "react";
import { Subscription } from "ui/types";
import { formatDate } from "./formatDate";
import { isTrial } from "./utils";

export function ExpirationRow({ subscription }: { subscription: Subscription }) {
  if (subscription.plan.key.includes("beta") || !subscription.effectiveUntil) {
    return null;
  }

  let label = "Renewal date";

  if (isTrial(subscription)) {
    label = "Your team’s start date";
  } else if (subscription.status === "canceled") {
    label = "Subscription end date";
  }

  return (
    <div className="flex flex-row items-center justify-between border-b border-themeBase-85 py-2">
      <span>{label}</span>
      <span>{formatDate(subscription.effectiveUntil, "long")}</span>
    </div>
  );
}
