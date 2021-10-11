import React from "react";
import { CancelSubscription } from "./CancelSubscription";
import { BillingBanners } from "./BillingBanners";
import { SubscriptionDetails } from "./SubscriptionDetails";
import { Subscription } from "ui/types";
import { Views } from "./utils";

export function SubscriptionDetailsView({
  subscription,
  setView,
  workspaceId,
}: {
  subscription: Subscription;
  setView: (view: Views) => void;
  workspaceId: string;
}) {
  return (
    <>
      <BillingBanners subscription={subscription} />
      <SubscriptionDetails
        subscription={subscription}
        onAddPaymentMethod={() => setView("add-payment-method")}
        onDeletePaymentMethod={() => setView("delete-payment-method")}
      />
      <CancelSubscription subscription={subscription} workspaceId={workspaceId} />
    </>
  );
}
