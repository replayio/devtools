import React from "react";
import hooks from "ui/hooks";
import { Subscription } from "ui/types";
import { Button } from "../Button";
import { SettingsHeader } from "../SettingsModal/SettingsBody";
import { BillingBanners } from "./BillingBanners";
import { ExpirationRow } from "./ExpirationRow";
import { isSubscriptionCancelled, getPlanDisplayText, formatPaymentMethod, Views } from "./utils";
import { inUnpaidFreeTrial, freeTrialExpiresIn } from "ui/utils/workspace";

function TrialDetails({
  workspaceId,
  onSelectPricing,
  expiresIn,
}: {
  workspaceId: string;
  onSelectPricing: () => void;
  expiresIn: number;
}) {
  const { workspace } = hooks.useGetWorkspace(workspaceId);

  if (expiresIn > 0) {
    return (
      <>
        <SettingsHeader>Trial Expiring Soon</SettingsHeader>
        <div className="p-4 ">
          <div
            style={{ boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)" }}
            className="space-y-6 bg-white pt-8 pb-4 px-6 text-lg rounded"
          >
            <p>
              {workspace.name} Free Trial will be expiring in{" "}
              {expiresIn == 1 ? (
                <span className="font-bold whitespace-nowrap">1 day</span>
              ) : (
                <span className="font-bold whitespace-nowrap">{expiresIn} days</span>
              )}
              .
            </p>
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

  return (
    <>
      <SettingsHeader>Trial Expired</SettingsHeader>
      <div className="p-4 ">
        <div
          style={{ boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)" }}
          className="space-y-6 bg-white pt-8 pb-4 px-6 text-lg rounded"
        >
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
  workspaceId,
  confirmed,
}: {
  confirmed?: boolean;
  subscription: Subscription;
  workspaceId: string;

  setView: (view: Views) => void;
}) {
  const expiresIn = freeTrialExpiresIn(subscription);
  if (inUnpaidFreeTrial(subscription)) {
    return (
      <TrialDetails
        workspaceId={workspaceId}
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
