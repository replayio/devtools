import React, { useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import hooks from "ui/hooks";
import { isDevelopment } from "ui/utils/environment";

import { SettingsHeader } from "../SettingsModal/SettingsBody";
import { AddPaymentMethod } from "./AddPaymentMethod";
import { ConsentForm } from "./ConsentForm";
import { getViewTitle, Views } from "./utils";

import { CancelSubscription } from "./CancelSubscription";
import { DeleteConfirmation } from "./DeleteConfirmation";
import { BillingBanners } from "./BillingBanners";
import { Confirmation } from "./Confirmation";
import { SubscriptionDetails } from "./SubscriptionDetails";

// By default, we use the test key for local development and the live key
// otherwise. Setting RECORD_REPLAY_STRIPE_LIVE to a truthy value will force
// usage of the live key.
export const stripePromise = loadStripe(
  !isDevelopment()
    ? "pk_live_51IxKTQEfKucJn4vkdJyNElRNGAACWDbCZN5DEts1AwxLyO0XyKlkdktz3meLLBQCp63zmuozrnsVlzwIC9yhFPSM00UXegj4R1"
    : "pk_test_51IxKTQEfKucJn4vkBYgiHf8dIZPlzC96neLXfRmOKhEI0tmFwe21aRegxJLUntV8UoETbPj2XNuA3KSayIR4nWXt00Vd4mZq4Z"
);

export default function WorkspaceSubscription({ workspaceId }: { workspaceId: string }) {
  const [view, setView] = useState<Views>("details");
  const { data, loading } = hooks.useGetWorkspaceSubscription(workspaceId);

  if (loading) return null;

  if (!data?.node.subscription) {
    return (
      <section className="space-y-8">
        <p>This team does not have an active subscription</p>
      </section>
    );
  }

  return (
    <>
      <SettingsHeader>{getViewTitle(view)}</SettingsHeader>
      <section className="space-y-6 overflow-y-auto" style={{ marginRight: -16, paddingRight: 16 }}>
        {view === "details" ? (
          <>
            <BillingBanners subscription={data.node.subscription} />
            <SubscriptionDetails
              subscription={data.node.subscription}
              onAddPaymentMethod={() => setView("add-payment-method")}
              onDeletePaymentMethod={() => setView("delete-payment-method")}
            />
            <CancelSubscription subscription={data.node.subscription} workspaceId={workspaceId} />
          </>
        ) : null}
        {view === "add-payment-method" ? (
          <ConsentForm
            subscription={data.node.subscription}
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
        {view === "confirm-payment-method" ? (
          <Confirmation subscription={data.node.subscription} />
        ) : null}
        {view === "delete-payment-method" ? (
          <DeleteConfirmation
            subscription={data.node.subscription}
            workspaceId={workspaceId}
            onDone={() => setView("details")}
          />
        ) : null}
      </section>
    </>
  );
}
