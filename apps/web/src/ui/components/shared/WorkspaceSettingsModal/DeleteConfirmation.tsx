import classNames from "classnames";
import React from "react";
import hooks from "ui/hooks";
import { Subscription } from "ui/types";
import { formatPaymentMethod } from "./utils";

export function DeleteConfirmation({
  workspaceId,
  subscription,
  onDone,
}: {
  workspaceId: string;
  subscription: Subscription;
  onDone: () => void;
}) {
  const { deleteWorkspacePaymentMethod, loading, error } = hooks.useDeleteWorkspacePaymentMethod();

  const handleDeletePaymentMethod = () =>
    deleteWorkspacePaymentMethod({
      variables: {
        workspaceId,
        paymentMethodId: subscription.paymentMethods[0].id,
      },
    }).then(onDone);

  if (error) {
    return <section className="text-red">Unable to remove a payment method at this time.</section>;
  }

  return (
    <section className="space-y-6">
      <p>
        Removing a payment method will prevent any future charges for this subscription. Add a new
        payment method to continue your subscription beyond the current billing cycle.
      </p>
      <p>Are you sure you want to remove {formatPaymentMethod(subscription.paymentMethods[0])}?</p>
      <div className="flex flex-row space-x-6 justify-center">
        <button
          className={classNames(
            "border border-primaryAccent text-primaryAccent px-6 py-3 rounded-md",
            {
              "opacity-60": loading,
            }
          )}
          onClick={loading ? undefined : onDone}
        >
          Cancel
        </button>
        <button
          disabled={loading}
          className={classNames("bg-red-500 text-white px-6 py-3 rounded-md", {
            "opacity-60": loading,
          })}
          onClick={loading ? undefined : handleDeletePaymentMethod}
        >
          Remove Payment Method
        </button>
      </div>
    </section>
  );
}
