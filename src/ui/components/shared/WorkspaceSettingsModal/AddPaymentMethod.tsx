import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import React, { useEffect, useState } from "react";
import hooks from "ui/hooks";

import { Button } from "../Button";

import { CountrySelect } from "./CountrySelect";
import { FieldRow } from "./FieldRow";
import { InputField } from "./InputField";

export const getValue = (form: HTMLFormElement, field: string) => {
  const input = form.elements.namedItem(field);
  if (input instanceof HTMLInputElement) {
    return input.value;
  }
};

function hasStripeState(state: string) {
  const el = document.querySelector("#stripe-card-element");
  return el ? el.classList.contains(`StripeElement--${state}`) : false;
}

export function EnterPaymentMethod({
  onCancel,
  onSave,
  workspaceId,
  stripePromise,
}: {
  onCancel: () => void;
  onSave: (billingDetails: { paymentMethodBillingId: string | null }) => void;
  workspaceId: string;
  stripePromise: Promise<any>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [stripeError, setStripeError] = useState<string>();
  const stripe = useStripe();
  const elements = useElements();
  const { prepareWorkspacePaymentMethod, loading } = hooks.usePrepareWorkspacePaymentMethod();

  useEffect(() => {
    stripePromise.catch(() => setError("Unable to add a payment method at this time."));
  }, [stripePromise]);

  useEffect(() => {
    const cardElement = elements?.getElement(CardElement);

    function updateStripeError() {
      if (hasStripeState("complete")) {
        setStripeError("");
      } else if (hasStripeState("invalid")) {
        setStripeError("Payment method is invalid");
      }
    }

    cardElement?.on("blur", updateStripeError);

    return () => {
      cardElement?.off("blur", updateStripeError);
    };
  }, [elements, setStripeError]);

  const handleSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    if (!stripe || !elements || loading || saving) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    const form = ev.currentTarget;
    const billing_details = {
      address: {
        city: getValue(form, "city"),
        country: getValue(form, "country"),
        line1: getValue(form, "line1"),
        line2: getValue(form, "line2"),
        postal_code: getValue(form, "postalCode"),
        state: getValue(form, "state"),
      },
      name: getValue(form, "fullName"),
    };

    if (!cardElement) {
      console.error("Unable to find card element");
      return;
    }

    if (!hasStripeState("complete")) {
      setStripeError("Payment method is invalid");
      cardElement.focus();
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

      setError(undefined);
      setSaving(true);

      const confirm = await stripe.confirmCardSetup(
        resp.data.prepareWorkspacePaymentMethod.paymentSecret,
        {
          payment_method: {
            billing_details,
            card: cardElement,
          },
        }
      );

      if (confirm.error) {
        throw confirm.error;
      }

      onSave({ paymentMethodBillingId: confirm.setupIntent.payment_method });
    } catch (e) {
      console.error(e);
      setError("Failed to create payment method. Please try again later.");
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  const bodyColor = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--body-color");

  return (
    <form className="space-y-4" onSubmit={ev => handleSubmit(ev)}>
      <FieldRow>
        {stripeError ? <p className="col-span-3 text-red-500">{stripeError}</p> : null}
        <CardElement
          className="col-span-3 p-1"
          options={{
            hidePostalCode: true,
            style: {
              base: {
                ":-webkit-autofill": {
                  color: bodyColor,
                },
                "::placeholder": {
                  color: bodyColor,
                },
                color: bodyColor,
                iconColor: bodyColor,
              },
              invalid: {
                color: "red",
                iconColor: "red",
              },
            },
          }}
          id="stripe-card-element"
        />
      </FieldRow>
      <InputField id="fullName" required label="Cardholder Name" autoComplete="name" />
      <InputField id="line1" required label="Address" autoComplete="street-address" />
      {/* <InputField id="line2" label="Address Line 2" /> */}
      <InputField id="city" required label="City" autoComplete="city" />
      <InputField id="state" required label="State / Province" autoComplete="address-level1" />
      <InputField id="postalCode" required label="Postal Code" autoComplete="postal-code" />
      <CountrySelect />
      <div className="flex flex-row items-center justify-end space-x-4 border-t border-gray-200 pt-5 pb-2">
        <Button
          size="sm"
          color="blue"
          style="secondary"
          onClick={onCancel}
          className={saving ? "opacity-60" : undefined}
          type="button"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          color="blue"
          style="primary"
          type="submit"
          className={saving ? "opacity-60" : undefined}
        >
          Save
        </Button>
      </div>
    </form>
  );
}
