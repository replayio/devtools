import React from "react";
import { SubscriptionWithPricing } from "ui/types";
import { ExpirationRow } from "./ExpirationRow";
import startCase from "lodash/startCase";
import { cycleCharge } from "./utils";

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
            <span>${subscription.seatPrice}</span>
          </div>
          <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
            <span>{startCase(subscription.billingSchedule)} charge</span>
            <span>${cycleCharge(subscription)}</span>
          </div>
        </>
      )}
    </>
  );
}
