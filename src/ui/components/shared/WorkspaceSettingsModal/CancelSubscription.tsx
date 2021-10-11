import classNames from "classnames";
import React from "react";
import hooks from "ui/hooks";
import { Subscription } from "ui/types";

export function CancelSubscription({
  subscription,
  workspaceId,
  actions,
}: {
  subscription: Subscription;
  workspaceId: string;
}) {
  if (subscription.status !== "active" && subscription.status !== "trialing") {
    return null;
  }

  return (
    <section className="space-y-4">
      <h3 className="border-b py-2 text-lg font-bold">Danger Zone</h3>
      <div className="border border-red-300 flex flex-row items-center justify-between rounded-lg p-3 space-x-3">
        <div className="flex flex-col">
          <div className="font-semibold">Cancel Subscription</div>
          <div className="">
            Cancellation will take effect at the end of the current billing period.
          </div>
        </div>
        <button
          onClick={actions.handleCancelSubscription}
          className={classNames(
            "max-w-max items-center px-4 py-2 flex-shrink-0 border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent text-white bg-red-600 hover:bg-red-700",
            { "opacity-60": actions.cancelLoading }
          )}
        >
          Cancel Subscription
        </button>
      </div>
    </section>
  );
}
