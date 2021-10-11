import React from "react";
import { Subscription } from "ui/types";
import { ExpirationRow } from "./ExpirationRow";

export function PlanDetails({ subscription }: { subscription: Subscription }) {
  return (
    <>
      <ExpirationRow subscription={subscription} label="Your team's start date" />
      <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
        <span>Renewal Schedule</span>
        <span>Monthly</span>
      </div>
      <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
        <span>Number of seats</span>
        <span>{subscription.seatCount}</span>
      </div>
      <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
        <span>Cost per seat</span>
        <span>$20</span>
      </div>
      <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
        <span>Monthly charge</span>
        <span>${20 * subscription.seatCount} per month</span>
      </div>
    </>
  );
}
