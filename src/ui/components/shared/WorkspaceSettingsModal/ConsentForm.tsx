import React from "react";
import { Subscription } from "ui/types";
import { PlanDetails } from "./PlanDetails";

export function ConsentForm({
  subscription,
  onEnterCard,
}: {
  subscription: Subscription;
  onEnterCard: () => void;
}) {
  return (
    <section>
      <PlanDetails subscription={subscription} />
      <button
        className="bg-primaryAccent text-white w-full px-6 py-3 my-6 rounded-md"
        onClick={onEnterCard}
      >
        Add Credit Card
      </button>
      <a
        href="https://www.replay.io/terms-of-use"
        target="_blank"
        rel="noreferrer"
        className="underline"
      >
        Terms of service and cancellation policy
      </a>
    </section>
  );
}
