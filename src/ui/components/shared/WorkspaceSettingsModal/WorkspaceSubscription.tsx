import React, { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import hooks from "ui/hooks";
import { isDevelopment } from "ui/utils/environment";
import { sendTelemetryEvent } from "ui/utils/telemetry";

import { SettingsHeader } from "../SettingsModal/SettingsBody";

import { EnterPaymentMethod } from "./AddPaymentMethod";
import { DeleteConfirmation } from "./DeleteConfirmation";
import { Details } from "./Details";
import { TeamPricingPage } from "./TeamPricingPage";
import { getViewTitle, Views } from "./utils";

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
  const [confirmed, setConfirmed] = useState(false);
  const { data, loading, error, refetch } = hooks.useGetWorkspaceSubscription(workspaceId);

  // clear the confirmed state if changing views
  useEffect(() => {
    if (confirmed && view !== "details") {
      setConfirmed(false);
    }
  }, [confirmed, view]);

  useEffect(() => {
    if (error) {
      sendTelemetryEvent("DevtoolsGraphQLError", {
        source: "useGetWorkspaceSubscription",
        workspaceId,
        message: error,
        environment: isDevelopment() ? "dev" : "prod",
      });
    }
  });

  if (loading || !data) {
    return null;
  }

  const { subscription } = data.node;

  if (error) {
    return (
      <section className="space-y-8">
        <p>
          Unable to load the subscription at this time. We are looking into it on our end and feel
          free to email us at <a href="mailto:support@replay.io">support@replay.io</a> if this
          problem persists.
        </p>
      </section>
    );
  }

  if (!subscription) {
    return (
      <section className="space-y-8">
        <p>This team does not have an active subscription</p>
      </section>
    );
  }

  return (
    <section className="space-y-6 overflow-y-auto" style={{ marginRight: -16, paddingRight: 16 }}>
      {view === "details" && (
        <Details
          workspaceId={workspaceId}
          subscription={subscription}
          setView={setView}
          confirmed={confirmed}
        />
      )}
      {view === "add-payment-method" && (
        <>
          <SettingsHeader>{getViewTitle(view)}</SettingsHeader>
          <TeamPricingPage
            subscription={subscription}
            onEnterCard={() => setView("enter-payment-method")}
          />
        </>
      )}
      {view === "enter-payment-method" && (
        <Elements stripe={stripePromise}>
          <SettingsHeader>{getViewTitle(view)}</SettingsHeader>
          <EnterPaymentMethod
            onCancel={() => setView("details")}
            onSave={() => {
              refetch().then(() => {
                setView("details");
                setConfirmed(true);
              });
            }}
            workspaceId={workspaceId}
            // TODO: handle the error at this level...
            stripePromise={stripePromise}
          />
        </Elements>
      )}
      {view === "delete-payment-method" && (
        <>
          <SettingsHeader>{getViewTitle(view)}</SettingsHeader>
          <DeleteConfirmation
            subscription={subscription}
            workspaceId={workspaceId}
            onDone={() => setView("details")}
          />
        </>
      )}
    </section>
  );
}
