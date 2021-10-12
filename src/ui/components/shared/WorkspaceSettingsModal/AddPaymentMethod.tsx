import React, { useEffect, useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import hooks from "ui/hooks";
import { Button } from "../Button";
import { FieldRow } from "./FieldRow";
import { InputField } from "./InputField";
import { CountrySelect } from "./CountrySelect";

export const getValue = (form: HTMLFormElement, field: string) => {
  const input = form.elements.namedItem(field);
  if (input instanceof HTMLInputElement) {
    return input.value;
  }
};

export function EnterPaymentMethod({
  onCancel,
  onSave,
  workspaceId,
  stripePromise,
}: {
  onCancel: () => void;
  onSave: () => void;
  workspaceId: string;
  stripePromise: Promise<any>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const stripe = useStripe();
  const elements = useElements();
  const { prepareWorkspacePaymentMethod, loading } = hooks.usePrepareWorkspacePaymentMethod();

  useEffect(() => {
    stripePromise.catch(() => setError("Unable to add a payment method at this time."));
  }, [stripePromise]);

  const handleSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    if (!stripe || !elements || loading || saving) {
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

      setError(undefined);
      setSaving(true);

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

      onSave();
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

  return (
    <form className="space-y-4" onSubmit={ev => handleSubmit(ev)}>
      <FieldRow>
        <CardElement className="col-span-3" options={{ hidePostalCode: true }} />
      </FieldRow>
      <InputField id="fullName" required label="Cardholder Name" autoComplete="name" />
      <InputField id="line1" required label="Address" autoComplete="street-address" />
      {/* <InputField id="line2" label="Address Line 2" /> */}
      <InputField id="city" required label="City" autoComplete="city" />
      <InputField id="state" required label="State / Province" autoComplete="address-level1" />
      <InputField id="postalCode" required label="Postal Code" autoComplete="postal-code" />
      <CountrySelect />
      <div className="space-x-4 flex flex-row items-center justify-end pt-5 border-t border-gray-200 ">
        <Button
          size="sm"
          color="blue"
          style="secondary"
          onClick={onCancel}
          className={saving ? "opacity-60" : undefined}
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
