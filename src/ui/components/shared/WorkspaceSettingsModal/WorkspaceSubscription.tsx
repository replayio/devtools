import React, { useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import hooks from "ui/hooks";
import { isDevelopment } from "ui/utils/environment";

import { SettingsHeader } from "../SettingsModal/SettingsBody";
import { AddPaymentMethod } from "./AddPaymentMethod";
import { ConsentForm } from "./ConsentForm";
import { getViewTitle, Views } from "./utils";

import { Button } from "../Button";
import { CancelSubscription } from "./CancelSubscription";
import { DeleteConfirmation } from "./DeleteConfirmation";
import { BillingBanners } from "./BillingBanners";
import { Confirmation } from "./Confirmation";
import { SubscriptionDetails } from "./SubscriptionDetails";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import { Subscription } from "ui/types";

// By default, we use the test key for local development and the live key
// otherwise. Setting RECORD_REPLAY_STRIPE_LIVE to a truthy value will force
// usage of the live key.
export const stripePromise = loadStripe(
  !isDevelopment()
    ? "pk_live_51IxKTQEfKucJn4vkdJyNElRNGAACWDbCZN5DEts1AwxLyO0XyKlkdktz3meLLBQCp63zmuozrnsVlzwIC9yhFPSM00UXegj4R1"
    : "pk_test_51IxKTQEfKucJn4vkBYgiHf8dIZPlzC96neLXfRmOKhEI0tmFwe21aRegxJLUntV8UoETbPj2XNuA3KSayIR4nWXt00Vd4mZq4Z"
);

function Details({
  subscription,
  setView,
  workspaceId,
}: {
  subscription: Subscription;
  workspaceId: string;
  setView: (view: Views) => {};
}) {
  if (subscription.status == "trialing") {
    const days = differenceInCalendarDays(new Date(subscription.trialEnds), Date.now());
    return (
      <>
        <SettingsHeader>Trial expiring soon</SettingsHeader>
        <div className="p-4 ">
          <div
            style={{ boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)" }}
            className="bg-white pt-8 pb-4 px-6 text-center text-lg rounded"
          >
            We hope you’ve been enjoying Replay! Your access will run out in{" "}
            <span className="font-bold">{days} days</span>.
            <div className="flex justify-center mt-6">
              <Button size="xl" color="blue" style="primary" type="submit" className="">
                Team Plan Pricing
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <SettingsHeader>{getViewTitle("details")}</SettingsHeader>
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
  console.log(data.node.subscription);

  return (
    <>
      <section className="space-y-6 overflow-y-auto" style={{ marginRight: -16, paddingRight: 16 }}>
        {view === "details" && (
          <Details
            workspaceId={workspaceId}
            subscription={data.node.subscription}
            setView={setView}
          />
        )}
        {view === "add-payment-method" && (
          <>
            <SettingsHeader>{getViewTitle(view)}</SettingsHeader>
            <ConsentForm
              subscription={data.node.subscription}
              onEnterCard={() => setView("enter-payment-method")}
            />
          </>
        )}
        {view === "enter-payment-method" && (
          <>
            <SettingsHeader>{getViewTitle(view)}</SettingsHeader>
            <Elements stripe={stripePromise}>
              <AddPaymentMethod
                onCancel={() => setView("details")}
                onSave={() => setView("confirm-payment-method")}
                workspaceId={workspaceId}
                // TODO: handle the error at this level...
                stripePromise={stripePromise}
              />
            </Elements>
          </>
        )}
        {view === "confirm-payment-method" && (
          <>
            <SettingsHeader>{getViewTitle(view)}</SettingsHeader>
            <Confirmation subscription={data.node.subscription} />
          </>
        )}
        {view === "delete-payment-method" && (
          <>
            <SettingsHeader>{getViewTitle(view)}</SettingsHeader>
            <DeleteConfirmation
              subscription={data.node.subscription}
              workspaceId={workspaceId}
              onDone={() => setView("details")}
            />
          </>
        )}
      </section>
    </>
  );
}
