import React from "react";
import { Subscription } from "ui/types";
import { cycleCharge, fullPricingDetailsForSubscription } from "ui/utils/billing";
import { ExpirationRow } from "./ExpirationRow";
import startCase from "lodash/startCase";

export function PlanDetails({ subscription }: { subscription: Subscription }) {
  const fullPricingDetails = fullPricingDetailsForSubscription(subscription);
  return (
    <>
      <ExpirationRow subscription={subscription} />
      <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
        <span>Renewal Schedule</span>
        <span>Monthly</span>
      </div>
      <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
        <span>Number of seats</span>
        <span>{fullPricingDetails.seatCount}</span>
      </div>
      <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
        <span>Cost per seat</span>
        <span>${fullPricingDetails.seatPrice}</span>
      </div>
      <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
        <span>{startCase(fullPricingDetails.billingSchedule)} charge</span>
        <span>${cycleCharge(fullPricingDetails)}</span>
      </div>
    </>
  );
}
