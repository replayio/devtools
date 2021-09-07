import classNames from "classnames";
import React, { useState } from "react";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import hooks from "ui/hooks";
import { PaymentMethod } from "ui/types";
import { isDevelopment } from "ui/utils/environment";
import { features } from "ui/utils/prefs";

import MaterialIcon from "../MaterialIcon";
import { Button } from "../Button";

// By default, we use the test key for local development and the live key
// otherwise. Setting RECORD_REPLAY_STRIPE_LIVE to a truthy value will force
// usage of the live key.
const stripePromise = loadStripe(
  process.env.RECORD_REPLAY_STRIPE_LIVE || !isDevelopment()
    ? "pk_live_51IxKTQEfKucJn4vkdJyNElRNGAACWDbCZN5DEts1AwxLyO0XyKlkdktz3meLLBQCp63zmuozrnsVlzwIC9yhFPSM00UXegj4R1"
    : "pk_test_51IxKTQEfKucJn4vkBYgiHf8dIZPlzC96neLXfRmOKhEI0tmFwe21aRegxJLUntV8UoETbPj2XNuA3KSayIR4nWXt00Vd4mZq4Z"
);

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
      <header className="bg-blue-200 p-3 border-b border-blue-600 flex flex-row items-center">
        <MaterialIcon className="mr-3 text-2xl">group</MaterialIcon>
        <h3 className="text-lg font-semibold">{title}</h3>
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

function Field({
  className,
  id,
  label,
  ...rest
}: { label: string } & React.HTMLProps<HTMLInputElement>) {
  return (
    <div className={classNames(className, "flex flex-row items-center space-x-4")}>
      <label htmlFor={id}>{label}</label>
      <input type="text" {...rest} id={id} name={id} className="flex-grow px-2 py-1" />
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
        <span className="flex-auto text-lg font-bold">New Payment Method</span>
        <Button size="sm" color="blue" style="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button size="sm" color="blue" style="primary" type="submit">
          Save
        </Button>
      </h3>
      <CardElement />
      <Field id="fullName" required label="Cardholder Name" />
      <Field id="line1" required label="Address Line 1" />
      <Field id="line2" label="Address Line 2" />
      <Field id="city" required label="City" />
      <Field id="state" required label="State" placeholder="Two-character Code" />
      <Field id="country" required label="Country" placeholder="Two-character Code" />
      <Field id="postalCode" required label="Postal Code" />
      <div className="space-x-4 flex flex-row items-center justify-end"></div>
    </form>
  );
}

function BillingDetails({
  onAddMethod,
  paymentMethods,
  workspaceId,
}: {
  onAddMethod: () => void;
  paymentMethods: PaymentMethod[];
  workspaceId: string;
}) {
  const [adding, setAdding] = useState(false);
  const handleDone = () => {
    onAddMethod();
    setAdding(false);
  };

  return (
    <Elements stripe={stripePromise}>
      {adding ? (
        <AddPaymentMethod onDone={handleDone} workspaceId={workspaceId} />
      ) : (
        <section className="space-y-4">
          <h3 className="flex flex-row border-b py-2 items-center">
            <span className="flex-auto text-lg font-bold">Payment Methods</span>
            {paymentMethods.length === 0 ? (
              <Button size="sm" color="blue" style="primary" onClick={() => setAdding(true)}>
                + Add
              </Button>
            ) : null}
          </h3>
          {paymentMethods.length === 0 ? (
            <p className="text-center">A payment method has not been added to this workspace.</p>
          ) : (
            paymentMethods.map(pm => (
              <div className="flex flex-row items-center space-x-2" key={pm.id}>
                <div>{pm.card.brand}</div>
                <div className="flex-grow">{pm.card.last4}</div>
              </div>
            ))
          )}
        </section>
      )}
    </Elements>
  );
}

export default function WorkspaceSubscription({ workspaceId }: { workspaceId: string }) {
  const { data, loading, refetch } = hooks.useGetWorkspaceSubscription(workspaceId);
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
    <section className="space-y-8 overflow-y-auto" style={{ marginRight: -12, paddingRight: 12 }}>
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
      {features.billing ? (
        <BillingDetails
          paymentMethods={data.node.subscription.paymentMethods}
          workspaceId={workspaceId}
          onAddMethod={refetch}
        />
      ) : null}
      {data.node.subscription.status === "active" ||
      data.node.subscription.status === "trialing" ? (
        <section className="space-y-4">
          <h3 className="border-b py-2 text-lg font-bold">Danger Zone</h3>
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
                "max-w-max items-center px-4 py-2 flex-shrink-0 border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent text-white bg-red-600 hover:bg-red-700",
                { "opacity-60": cancelLoading }
              )}
            >
              Cancel Subscription
            </button>
          </div>
        </section>
      ) : null}
    </section>
  );
}
