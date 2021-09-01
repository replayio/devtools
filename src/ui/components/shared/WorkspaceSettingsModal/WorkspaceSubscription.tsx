import classNames from "classnames";
import React, { useState } from "react";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import hooks from "ui/hooks";
import { PaymentMethod } from "ui/types";

import MaterialIcon from "../MaterialIcon";

const stripePromise = process.env.RECORD_REPLAY_STRIPE_KEY
  ? loadStripe(process.env.RECORD_REPLAY_STRIPE_KEY)
  : Promise.reject("Stripe key is unavailable");

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

function Field({ id, label, required = false }: { id: string; label: string; required?: boolean }) {
  return (
    <div className="flex flex-row items-center space-x-4">
      <label htmlFor={id}>{label}</label>
      <input required={required} type="text" id={id} name={id} className="flex-grow" />
    </div>
  );
}

const getValue = (form: HTMLFormElement, field: string) => {
  const input = form.elements.namedItem(field);
  if (input instanceof HTMLInputElement) {
    return input.value;
  }
};

function AddPaymentMethod({ onDone, workspaceId }: { onDone: () => void; workspaceId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { prepareWorkspacePaymentMethod, loading } = hooks.usePrepareWorkspacePaymentMethod();

  const handleSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    if (!stripe || !elements || loading) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    const form = ev.currentTarget;
    const billing_details = {
      name: getValue(form, "fullName"),
      address: {
        city: getValue(form, "city"),
        country: getValue(form, "country"),
        line1: getValue(form, "line1"),
        line2: getValue(form, "line2"),
        postal_code: getValue(form, "postalCode"),
        state: getValue(form, "state"),
      },
    };

    if (!cardElement) {
      console.error("Unable to find card element");
      return;
    }

    try {
      const resp = await prepareWorkspacePaymentMethod({
        variables: {
          workspaceId,
        },
      });

      if (!resp.data?.prepareWorkspacePaymentMethod.paymentSecret) {
        throw new Error("Failed to create payment seret");
      }

      const confirm = await stripe.confirmCardSetup(
        resp.data.prepareWorkspacePaymentMethod.paymentSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details,
          },
        }
      );

      if (confirm.error) {
        throw confirm.error;
      }

      onDone();
    } catch (e) {
      console.error("Failed to create payment method", e);
    }
  };

  return (
    <form className="space-y-4" onSubmit={ev => handleSubmit(ev)}>
      <h3 className="flex flex-row border-b py-2 items-center space-x-4">
        <span className="flex-auto text-xl font-bold">New Payment Method</span>
        <button type="button" onClick={onDone}>
          Cancel
        </button>
        <button type="submit">Save</button>
      </h3>
      <CardElement />
      <Field id="fullName" required label="Cardholder Name" />
      <Field id="line1" required label="Address Line 1" />
      <Field id="line2" label="Address Line 2" />
      <Field id="city" required label="City" />
      <Field id="state" required label="State" />
      <Field id="country" required label="Country" />
      <Field id="postalCode" required label="Postal Code" />
      <div className="space-x-4 flex flex-row items-center justify-end"></div>
    </form>
  );
}

function BillingDetails({
  paymentMethods,
  workspaceId,
}: {
  paymentMethods: PaymentMethod[];
  workspaceId: string;
}) {
  const [adding, setAdding] = useState(false);
  const { setWorkspaceDefaultPaymentMethod } = hooks.useSetWorkspaceDefaultPaymentMethod();

  return (
    <Elements stripe={stripePromise}>
      {adding ? (
        <AddPaymentMethod onDone={() => setAdding(false)} workspaceId={workspaceId} />
      ) : (
        <>
          <h3 className="flex flex-row border-b py-2 items-center">
            <span className="flex-auto text-xl font-bold">Payment Methods</span>
            <button onClick={() => setAdding(true)}>+ Add</button>
          </h3>
          {paymentMethods.map(pm => {
            return (
              <div className="flex flex-row items-center space-x-2" key={pm.id}>
                <div>{pm.card.brand}</div>
                <div className="flex-grow">{pm.card.last4}</div>
                {pm.default ? (
                  <div className="material-icons text-green-500">check_circle</div>
                ) : (
                  <button
                    onClick={() =>
                      setWorkspaceDefaultPaymentMethod({
                        variables: {
                          workspaceId,
                          paymentMethodId: pm.id,
                        },
                      })
                    }
                  >
                    Make Default
                  </button>
                )}
              </div>
            );
          })}
        </>
      )}
    </Elements>
  );
}

export default function WorkspaceSubscription({ workspaceId }: { workspaceId: string }) {
  const { data, loading } = hooks.useGetWorkspaceSubscription(workspaceId);
  const {
    cancelWorkspaceSubscription,
    loading: cancelLoading,
  } = hooks.useCancelWorkspaceSubscription();

  const handleCancelSubscription = () => {
    if (cancelLoading) return;

    cancelWorkspaceSubscription({
      variables: {
        workspaceId,
      },
    });
  };

  if (loading) return null;

  if (!data?.node.subscription) {
    return (
      <section className="space-y-8">
        <p>This team does not have an active subscription</p>
      </section>
    );
  }

  return (
    <section className="space-y-8 overflow-y-auto">
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
      <BillingDetails
        paymentMethods={data.node.subscription.paymentMethods}
        workspaceId={workspaceId}
      />
    </section>
  );
}
