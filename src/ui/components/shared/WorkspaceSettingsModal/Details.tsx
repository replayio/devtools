import React from "react";
import { CancelSubscription } from "./CancelSubscription";
import { BillingBanners } from "./BillingBanners";
import { SubscriptionDetails } from "./SubscriptionDetails";
import { Subscription } from "ui/types";
import { Views } from "./utils";

export function Details({
  subscription,
  setView,
  workspaceId,
  confirmed,
}: {
  confirmed?: boolean;
  subscription: Subscription;
  workspaceId: string;
  setView: (view: Views) => void;
}) {
  return (
    <>
      <BillingBanners subscription={subscription} confirmed={confirmed} />
      <SubscriptionDetails
        subscription={subscription}
        onAddPaymentMethod={() => setView("add-payment-method")}
        onDeletePaymentMethod={() => setView("delete-payment-method")}
      />
      <CancelSubscription subscription={subscription} workspaceId={workspaceId} />
    </>
  );
}
