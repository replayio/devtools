import React from "react";
import hooks from "ui/hooks";
import { Subscription, Workspace } from "ui/types";
import { Button } from "../Button";
import { SettingsHeader } from "../SettingsModal/SettingsBody";
import { BillingBanners } from "./BillingBanners";
import { ExpirationRow } from "./ExpirationRow";
import { isSubscriptionCancelled, getPlanDisplayText, formatPaymentMethod, Views } from "./utils";
import { inUnpaidFreeTrial, subscriptionEndsIn } from "ui/utils/workspace";

function TrialDetails({
  workspace,
  onSelectPricing,
  expiresIn,
}: {
  workspace: Workspace;
  onSelectPricing: () => void;
  expiresIn: number;
}) {
  const expired = expiresIn <= 0;

  return (
    <>
      <SettingsHeader>{expired ? "Trial Expired" : "Trial Expiring Soon"}</SettingsHeader>
      <div className="p-4">
        <div
          style={{ boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)" }}
          className="space-y-6 bg-white pt-8 pb-4 px-6 text-lg rounded"
        >
          {!expired && (
            <p>
              {workspace?.name} Free Trial will be expiring in{" "}
              <span className="font-bold whitespace-nowrap">
                {expiresIn === 1 ? "1 day" : `${expiresIn} days`}
              </span>
              .
            </p>
          )}
          <p>
            Existing replays will continue to be debuggable. New replays will require an active
            subscription. Feel free to <a href="mailto:support@replay.io">email</a> us if you have
            any questions.
          </p>
          <div className="flex justify-center">
            <Button
              size="xl"
              color="blue"
              style="primary"
              type="submit"
              className="w-full justify-center"
              onClick={onSelectPricing}
            >
              Team Plan Pricing
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function SubscriptionDetails({
  subscription,
  onAddPaymentMethod,
  onDeletePaymentMethod,
}: {
  subscription: Subscription;
  onAddPaymentMethod: () => void;
  onDeletePaymentMethod: () => void;
}) {
  return (
    <section>
      <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
        <span>Current Plan</span>
        <span>{getPlanDisplayText(subscription)}</span>
      </div>
      <ExpirationRow subscription={subscription} />
      <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
        <span>Number of seats</span>
        <span>{subscription.seatCount}</span>
      </div>
      {isSubscriptionCancelled(subscription) ? null : (
        <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
          <span>Payment Method</span>
          <span className="flex flex-col items-end">
            {subscription.paymentMethods.length > 0 ? (
              <button
                className="text-primaryAccent hover:underline"
                onClick={onDeletePaymentMethod}
              >
                {formatPaymentMethod(subscription.paymentMethods[0])}
              </button>
            ) : (
              <button className="text-primaryAccent hover:underline" onClick={onAddPaymentMethod}>
                Add Payment Method
              </button>
            )}
          </span>
        </div>
      )}
    </section>
  );
}

export function Details({
  subscription,
  setView,
  workspace,
  confirmed,
}: {
  confirmed?: boolean;
  subscription: Subscription;
  workspace: Workspace;
  setView: (view: Views) => void;
}) {
  if (inUnpaidFreeTrial(workspace)) {
    const expiresIn = subscriptionEndsIn(workspace);

    return (
      <TrialDetails
        workspace={workspace}
        expiresIn={expiresIn}
        onSelectPricing={() => setView("add-payment-method")}
      />
    );
  }

  return (
    <>
      <SettingsHeader>Billing</SettingsHeader>
      <BillingBanners subscription={subscription} confirmed={confirmed} />
      <SubscriptionDetails
        subscription={subscription}
        onAddPaymentMethod={() => setView("add-payment-method")}
        onDeletePaymentMethod={() => setView("delete-payment-method")}
      />
    </>
  );
}
