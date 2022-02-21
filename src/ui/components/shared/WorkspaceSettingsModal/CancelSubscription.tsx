import classNames from "classnames";
import React from "react";
import hooks from "ui/hooks";
import { Subscription } from "ui/types";

export function CancelSubscription({
  subscription,
  workspaceId,
}: {
  subscription: Subscription;
  workspaceId: string;
}) {
  const { cancelWorkspaceSubscription, loading: cancelLoading } =
    hooks.useCancelWorkspaceSubscription();

  const handleCancelSubscription = () => {
    if (cancelLoading) {
      return;
    }

    cancelWorkspaceSubscription({
      variables: {
        workspaceId,
      },
    });
  };

  if (subscription.status !== "active" && subscription.status !== "trialing") {
    return null;
  }

  return (
    <section className="space-y-4">
      <h3 className="border-b py-2 text-lg font-bold">Danger Zone</h3>
      <div className="flex flex-row items-center justify-between space-x-3 rounded-lg border border-red-300 p-3">
        <div className="flex flex-col">
          <div className="font-semibold">Cancel Subscription</div>
          <div className="">
            Cancellation will take effect at the end of the current billing period.
          </div>
        </div>
        <button
          onClick={handleCancelSubscription}
          className={classNames(
            "max-w-max flex-shrink-0 items-center rounded-md border border-transparent bg-red-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-primaryAccent focus:ring-offset-2",
            { "opacity-60": cancelLoading }
          )}
        >
          Cancel Subscription
        </button>
      </div>
    </section>
  );
}
