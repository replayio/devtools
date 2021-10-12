import React from "react";
import { Button } from "../Button";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import { Subscription } from "ui/types";
import hooks from "ui/hooks";

export default function TrialDetails({
  subscription,
  workspaceId,
  onSelectPricing,
}: {
  subscription: Subscription;
  workspaceId: string;
  onSelectPricing: () => void;
}) {
  const { workspace } = hooks.useGetWorkspace(workspaceId);
  if (subscription.status !== "trialing" || !subscription.trialEnds || !workspace) {
    return null;
  }

  const days = differenceInCalendarDays(new Date(subscription.trialEnds), Date.now());
  return (
    <div className="p-4 ">
      <div
        style={{ boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)" }}
        className="space-y-6 bg-white pt-8 pb-4 px-6 text-lg rounded"
      >
        <p>
          {workspace.name} Free Trial will be expiring in{" "}
          <span className="font-bold whitespace-nowrap">{days} days</span>.
        </p>
        <p>
          When the trial expires, existing replays will continue to be debuggable, but new replays
          will require an active subscription. Feel free to email us at{" "}
          <a href="mailto:support@replay.io">support@replay.io</a> if you have any questions.
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
  );
}
