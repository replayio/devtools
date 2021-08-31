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
          {getPlanDetails(data.node.subscription.plan.key)}
        </>
      ) : (
        <p>This team does not have an active subscription</p>
      )}
    </section>
  );
}
