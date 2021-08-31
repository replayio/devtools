import classNames from "classnames";
import React from "react";
import hooks from "ui/hooks";
import MaterialIcon from "../MaterialIcon";

function PlanDetails({
  title,
  description,
  features,
}: {
  title: string;
  description?: string;
  features?: string[];
}) {
  return (
    <section className="rounded-lg border border-blue-600 overflow-hidden">
      <header className="bg-blue-200 p-3 border-b border-blue-600 flex flex-row">
        <MaterialIcon className="mr-3 text-2xl">group</MaterialIcon>
        <h3 className="text-xl font-semibold">{title}</h3>
      </header>
      <div className="p-3">
        {description ? <p>{description}</p> : null}
        {features && features.length > 0 ? (
          <ul className="list-disc pl-6">
            {features.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

function getPlanDetails(key: string) {
  if (key === "test-beta-v1" || key === "beta-v1") {
    return (
      <PlanDetails
        title="Beta Plan"
        description="As a thank you for being a beta user, you have full access for a limited time to Replay including recording, debugging, and collaborating with your team."
      />
    );
  }

  if (key === "test-team-v1" || key === "team-v1") {
    return (
      <PlanDetails
        title="Team Plan"
        features={[
          "Unlimited recordings",
          "Team Library to easily share recordings",
          "Programmatic recording upload with personal and team API keys",
        ]}
      />
    );
  }

  return null;
}

export default function WorkspaceSubscription({ workspaceId }: { workspaceId: string }) {
  const { data, loading } = hooks.useGetWorkspaceSubscription(workspaceId);
  const { cancelWorkspaceSubscription, loading: cancelLoading } =
    hooks.useCancelWorkspaceSubscription();

  const handleCancelSubscription = () => {
    if (cancelLoading) return;

    cancelWorkspaceSubscription({
      variables: {
        workspaceId,
      },
    });
  };

  if (loading) return null;

  return (
    <section className="space-y-8">
      {data?.node.subscription ? (
        <>
          {data.node.subscription.status === "trialing" ? (
            <div className="p-3 bg-yellow-100 rounded-lg border border-yellow-600 flex flex-row items-center">
              <MaterialIcon className="mr-3">access_time</MaterialIcon>
              Trial ends&nbsp;
              <strong>
                {new Intl.DateTimeFormat("en", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                }).format(new Date(data.node.subscription.trialEnds!))}
              </strong>
            </div>
          ) : null}
          {data.node.subscription.status === "canceled" && data.node.subscription.effectiveUntil ? (
            <div className="p-4 bg-yellow-100 rounded-lg border border-yellow-600 flex flex-row items-center">
              <MaterialIcon className="mr-4">access_time</MaterialIcon>
              Subscription ends&nbsp;
              <strong>
                {new Intl.DateTimeFormat("en", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                }).format(new Date(data.node.subscription.effectiveUntil))}
              </strong>
            </div>
          ) : null}
          {getPlanDetails(data.node.subscription.plan.key)}
          {data.node.subscription.status === "active" ||
          data.node.subscription.status === "trialing" ? (
            <div className="flex flex-col space-y-4">
              <div className=" text-sm uppercase font-semibold">Danger Zone</div>
              <div className="border border-red-300 flex flex-row items-center justify-between rounded-lg p-4">
                <div className="flex flex-col">
                  <div className="font-semibold">Cancel Subscription</div>
                  <div className="">
                    Cancellation will take effect at the end of the current billing period.
                  </div>
                </div>
                <button
                  onClick={handleCancelSubscription}
                  className={classNames(
                    "max-w-max items-center px-4 py-2 flex-shrink-0 border border-transparent text-lg font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent text-white bg-red-600 hover:bg-red-700",
                    { "opacity-60": cancelLoading }
                  )}
                >
                  Cancel Subscription
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <p>This team does not have an active subscription</p>
      )}
    </section>
  );
}
