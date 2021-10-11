import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

import hooks from "ui/hooks";
import { isDevelopment } from "ui/utils/environment";

import { Views } from "./utils";

import { WorkspaceSubscriptionContainer } from "./WorkspaceSubscriptionContainer";

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
  const {
    cancelWorkspaceSubscription,
    loading: cancelLoading,
  } = hooks.useCancelWorkspaceSubscription();

  const handleCancelSubscription = () => {
    if (cancelLoading) return;

    cancelWorkspaceSubscription({
      variables: {
        workspaceId,
      },
    });
  };

  const actions = {
    handleCancelSubscription,
    cancelLoading,
  };

  if (loading) return null;

  if (!data?.node.subscription) {
    return (
      <section className="space-y-8">
        <p>This team does not have an active subscription</p>
      </section>
    );
  }

  return (
    <WorkspaceSubscriptionContainer
      subscription={data.node.subscription}
      workspaceId={workspaceId}
      view={view}
      actions={actions}
      setView={setView}
      stripePromise={stripePromise}
    ></WorkspaceSubscriptionContainer>
  );
}
