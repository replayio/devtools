import React from "react";
import { SubscriptionWithPricing, Workspace } from "ui/types";
import { Button } from "../Button";
import { SettingsHeader } from "../SettingsModal/SettingsBody";
import { BillingBanners } from "./BillingBanners";
import { PlanDetails } from "./PlanDetails";
import { isSubscriptionCancelled, formatPaymentMethod, Views } from "./utils";
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
          className="space-y-6 rounded bg-white px-6 pt-8 pb-4 text-lg"
        >
          {!expired && (
            <p>
              {workspace?.name} Free Trial will be expiring in{" "}
              <span className="whitespace-nowrap font-bold">
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
  subscription: SubscriptionWithPricing;
  onAddPaymentMethod: () => void;
  onDeletePaymentMethod: () => void;
}) {
  return (
    <section>
      <PlanDetails subscription={subscription} />
      {isSubscriptionCancelled(subscription) ||
      subscription.billingSchedule === "contract" ||
      subscription.plan.key === "beta-v1" ? null : (
        <div className="border-color-gray-50 flex flex-row items-center justify-between border-b py-2">
          <span>Payment Method</span>
          <span className="flex flex-col items-end">
            {subscription.paymentMethods && subscription.paymentMethods.length > 0 ? (
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
  onAddPaymentMethod,
  onDeletePaymentMethod,
  onResubscribe,
  workspace,
  confirmed,
}: {
  confirmed?: boolean;
  subscription: SubscriptionWithPricing;
  workspace: Workspace;
  onAddPaymentMethod: () => void;
  onDeletePaymentMethod: () => void;
  onResubscribe: () => void;
}) {
  if (inUnpaidFreeTrial(workspace)) {
    const expiresIn = subscriptionEndsIn(workspace);

    return (
      <TrialDetails
        workspace={workspace}
        expiresIn={expiresIn}
        onSelectPricing={onAddPaymentMethod}
      />
    );
  }

  return (
    <>
      <SettingsHeader>{`${subscription.displayName} Plan`}</SettingsHeader>
      <BillingBanners workspace={workspace} confirmed={confirmed} onResubscribe={onResubscribe} />
      <SubscriptionDetails
        subscription={subscription}
        onAddPaymentMethod={onAddPaymentMethod}
        onDeletePaymentMethod={onDeletePaymentMethod}
      />
    </>
  );
}
