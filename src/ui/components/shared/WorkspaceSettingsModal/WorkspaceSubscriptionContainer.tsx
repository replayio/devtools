import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { SettingsHeader } from "../SettingsModal/SettingsBody";
import { AddPaymentMethod } from "./AddPaymentMethod";
import { ConsentForm } from "./ConsentForm";
import { getViewTitle, Views } from "./utils";
import { DeleteConfirmation } from "./DeleteConfirmation";
import { Confirmation } from "./Confirmation";
import { SubscriptionDetailsView } from "./SubscriptionDetailsView";
import { Subscription } from "ui/types";
import "ui/components/shared/SettingsModal/SettingsBody.css";

// export function WorkspaceSubscriptionContainer() {
//   return <h3>hi</h3>;
// }

export function WorkspaceSubscriptionContainer({
  workspaceId,
  subscription,
  view,
  setView,
  stripePromise,
  actions = {},
}: {
  view: Views;
  subscription: Subscription;
  workspaceId: string;
  setView: (view: Views) => void;
  stripePromise: Promise<any>;
  actions: {};
}) {
  //   return <h3>Yo</h3>;
  return (
    <>
      <SettingsHeader>{getViewTitle(view)}</SettingsHeader>
      <section className="space-y-6 overflow-y-auto" style={{ marginRight: -16, paddingRight: 16 }}>
        {view === "details" ? (
          <SubscriptionDetailsView actions={actions} subscription={subscription} />
        ) : null}
        {view === "add-payment-method" ? (
          <ConsentForm
            subscription={subscription}
            onEnterCard={() => setView("enter-payment-method")}
          />
        ) : null}
        {view === "enter-payment-method" ? (
          <Elements stripe={stripePromise}>
            <AddPaymentMethod
              onCancel={() => setView("details")}
              onSave={() => setView("confirm-payment-method")}
              workspaceId={workspaceId}
              // TODO: handle the error at this level...
              stripePromise={stripePromise}
            />
          </Elements>
        ) : null}
        {view === "confirm-payment-method" ? <Confirmation subscription={subscription} /> : null}
        {view === "delete-payment-method" ? (
          <DeleteConfirmation
            subscription={subscription}
            workspaceId={workspaceId}
            onDone={() => setView("details")}
          />
        ) : null}
      </section>
    </>
  );
}
