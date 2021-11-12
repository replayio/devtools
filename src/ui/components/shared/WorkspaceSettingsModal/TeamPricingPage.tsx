import React from "react";
import { Subscription } from "ui/types";
import ExternalLink from "../ExternalLink";
import { Button } from "../Button";
import { PlanDetails } from "./PlanDetails";

export function TeamPricingPage({
  subscription,
  onEnterCard,
}: {
  subscription: Subscription;
  onEnterCard: () => void;
}) {
  return (
    <section>
      <p className="mb-4">
        With a Replay Team Plan, you can expand your debugging superpowers with powerful
        collaboration features that make it easy to work together to fix bugs and understand your
        software better.
        <ExternalLink href="https://www.replay.io/pricing" className="text-primaryAccent underline">
          Learn More
        </ExternalLink>
      </p>
      <PlanDetails subscription={subscription} />
      <Button
        color="blue"
        size="xl"
        style="primary"
        className="justify-center w-full my-6"
        onClick={onEnterCard}
      >
        Add Payment Method
      </Button>
      <ExternalLink href="https://www.replay.io/terms-of-use" className="underline">
        Terms of service and cancellation policy
      </ExternalLink>
    </section>
  );
}
