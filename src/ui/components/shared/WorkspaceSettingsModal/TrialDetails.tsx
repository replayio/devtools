import React from "react";
import { Button } from "../Button";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import { Subscription } from "ui/types";

export default function TrialDetails({
  subscription,
  onSelectPricing,
}: {
  subscription: Subscription;
  workspaceId: string;
  onSelectPricing: () => void;
}) {
  if (subscription.status !== "trialing" || !subscription.trialEnds) {
    return null;
  }

  const days = differenceInCalendarDays(new Date(subscription.trialEnds), Date.now());
  return (
    <div className="p-4 ">
      <div
        style={{ boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)" }}
        className="bg-white pt-8 pb-4 px-6 text-center text-lg rounded"
      >
        We hope you’ve been enjoying Replay! Your access will run out in{" "}
        <span className="font-bold">{days} days</span>.
        <div className="flex justify-center mt-6">
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
  );
}
