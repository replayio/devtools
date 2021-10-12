import React from "react";
import { Subscription } from "ui/types";
import { isSubscriptionCancelled, getPlanDisplayText, formatPaymentMethod } from "./utils";
import { ExpirationRow } from "./ExpirationRow";

export function SubscriptionDetails({
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
