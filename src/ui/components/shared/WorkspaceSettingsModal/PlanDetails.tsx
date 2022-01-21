import React from "react";
import { SubscriptionWithPricing } from "ui/types";
import { ExpirationRow } from "./ExpirationRow";
import startCase from "lodash/startCase";
import {
  cycleCharge,
  cycleDiscount,
  cycleSubtotal,
  formatCurrency,
  formatPercentage,
} from "./utils";

export function PlanDetails({ subscription }: { subscription: SubscriptionWithPricing }) {
  return (
    <>
      <ExpirationRow subscription={subscription} />
      <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
        <span>Renewal Schedule</span>
        <span>{startCase(subscription.billingSchedule || "monthly")}</span>
      </div>
      <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
        <span>Number of seats</span>
        <span>{subscription.seatCount}</span>
      </div>
      {subscription.billingSchedule && (
        <>
          <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
            <span>Cost per seat</span>
            <span>{formatCurrency(subscription.seatPrice)}</span>
          </div>
          {subscription.discount ? (
            <>
              <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between font-bold">
                <span>Subtotal</span>
                <span>{cycleSubtotal(subscription)}</span>
              </div>
              <div className="ml-3 py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
                <span>Discount ({formatPercentage(subscription.discount)})</span>
                <span>{cycleDiscount(subscription)}</span>
              </div>
            </>
          ) : null}
          <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between font-bold">
            <span>{startCase(subscription.billingSchedule)} charge</span>
            <span>{cycleCharge(subscription)}</span>
          </div>
        </>
      )}
    </>
  );
}
