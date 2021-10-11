import React from "react";
import { Subscription } from "ui/types";
import { PlanDetails } from "./PlanDetails";

export function Confirmation({ subscription }: { subscription: Subscription }) {
  return (
    <section>
      {/* <div className="h-36 mb-6 rounded-lg bg-blue-100" /> */}
      <PlanDetails subscription={subscription} />
    </section>
  );
}
