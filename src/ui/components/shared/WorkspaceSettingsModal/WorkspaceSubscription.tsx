import classNames from "classnames";
import React, { useEffect, useState } from "react";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { Redacted } from "ui/components/Redacted";
import hooks from "ui/hooks";
import { PaymentMethod, Subscription } from "ui/types";
import { isDevelopment } from "ui/utils/environment";
import { getFeatureFlag } from "ui/utils/launchdarkly";

import MaterialIcon from "../MaterialIcon";
import { Button } from "../Button";
import { SettingsHeader } from "../SettingsModal/SettingsBody";

// By default, we use the test key for local development and the live key
// otherwise. Setting RECORD_REPLAY_STRIPE_LIVE to a truthy value will force
// usage of the live key.
const stripePromise = loadStripe(
  true || !isDevelopment()
    ? "pk_live_51IxKTQEfKucJn4vkdJyNElRNGAACWDbCZN5DEts1AwxLyO0XyKlkdktz3meLLBQCp63zmuozrnsVlzwIC9yhFPSM00UXegj4R1"
    : "pk_test_51IxKTQEfKucJn4vkBYgiHf8dIZPlzC96neLXfRmOKhEI0tmFwe21aRegxJLUntV8UoETbPj2XNuA3KSayIR4nWXt00Vd4mZq4Z"
);

type Views = "details" | "add-payment-method" | "enter-payment-method" | "confirm-payment-method";

function isSubscriptionCancelled(subscription: Subscription) {
  return subscription.status === "canceled" && subscription.effectiveUntil;
}

function getViewTitle(view: Views) {
  switch (view) {
    case "details":
      return "Billing";
    case "add-payment-method":
    case "enter-payment-method":
      return "Add Payment Method";
    case "confirm-payment-method":
      return "Payment Method Added!";
  }
}

function getPlanDisplayText(subscription: Subscription) {
  const trial = subscription.status === "trialing";
  let text = "Team Plan";

  switch (subscription.plan.key) {
    case "beta-v1":
    case "test-beta-v1":
      text = "Beta Tester Appreciation Plan";
      break;
    case "team-v1":
    case "test-team-v1":
      text = "Team Plan";
      break;
  }

  return `${text} ${trial ? "(Trial)" : ""}`;
}

function ExpirationRow({ subscription, label }: { label: string; subscription: Subscription }) {
  const showTrialExpiration = getFeatureFlag("ui-trial-expiration", false);

  if (subscription.plan.key.includes("beta") || !showTrialExpiration || !subscription.trialEnds) {
    return null;
  }

  return (
    <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
      <span>{label}</span>
      <span>{formatDate(subscription.trialEnds, "long")}</span>
    </div>
  );
}

function PlanDetails({ subscription }: { subscription: Subscription }) {
  return (
    <>
      <ExpirationRow subscription={subscription} label="Your team's start date" />
      <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
        <span>Renewal Schedule</span>
        <span>Monthly</span>
      </div>
      <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
        <span>Number of seats</span>
        <span>{subscription.seatCount}</span>
      </div>
      <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
        <span>Cost per seat</span>
        <span>$20</span>
      </div>
      <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
        <span>Monthly charge</span>
        <span>${20 * subscription.seatCount} per month</span>
      </div>
    </>
  );
}

function FieldRow({ children, className, ...rest }: React.HTMLProps<HTMLDivElement>) {
  return (
    <div
      className={classNames(
        className,
        "grid grid-cols-3 gap-4 items-center border-t border-gray-200 pt-5"
      )}
    >
      {children}
    </div>
  );
}

interface FieldProps {
  label: string;
  id: string;
  className?: string;
}

function Field({ children, className, id, label }: FieldProps & { children: React.ReactNode }) {
  return (
    <FieldRow className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mt-px pt-2">
        {label}
      </label>
      <div className="mt-1 mt-0 col-span-2">{children}</div>
    </FieldRow>
  );
}

function InputField({
  className,
  id,
  label,
  ...rest
}: FieldProps & React.HTMLProps<HTMLInputElement>) {
  return (
    <Field id={id} className={className} label={label}>
      <div className="max-w-lg flex rounded-md shadow-sm">
        <input
          type="text"
          {...rest}
          name={id}
          id={id}
          className="flex-1 block w-full focus:ring-indigo-500 focus:border-indigo-500 min-w-0 rounded-md text-sm border-gray-300"
        />
      </div>
    </Field>
  );
}

function SelectField({
  children,
  className,
  id,
  label,
  ...rest
}: FieldProps & React.HTMLProps<HTMLSelectElement>) {
  return (
    <Field id={id} className={className} label={label}>
      <select
        {...rest}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      >
        {children}
      </select>
    </Field>
  );
}

const cardToDisplayType = (type: string) => {
  switch (type) {
    case "visa":
      return "Visa";
    case "amex":
      return "American Express";
    case "diners":
      return "Diners Club";
    case "jcb":
      return "JCB";
    case "mastercard":
      return "Mastercard";
    default:
      return "Card";
  }
};

const getValue = (form: HTMLFormElement, field: string) => {
  const input = form.elements.namedItem(field);
  if (input instanceof HTMLInputElement) {
    return input.value;
  }
};

function AddPaymentMethod({
  onCancel,
  onSave,
  workspaceId,
}: {
  onCancel: () => void;
  onSave: () => void;
  workspaceId: string;
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
    return (
      <div className="space-y-4">
        <h3 className="flex flex-row items-center space-x-4">
          <span className="flex-auto text-lg font-bold">New Payment Method</span>
        </h3>
        <p className="text-red-500">{error}</p>
      </div>
    );
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
      <SelectField id="country" required label="Country" autoComplete="country">
        <option value="" disabled selected>
          Choose your country
        </option>
        <option value="AF">Afghanistan</option>
        <option value="AX">Åland</option>
        <option value="AL">Albania</option>
        <option value="DZ">Algeria</option>
        <option value="AS">American Samoa</option>
        <option value="AD">Andorra</option>
        <option value="AO">Angola</option>
        <option value="AI">Anguilla</option>
        <option value="AQ">Antarctica</option>
        <option value="AG">Antigua and Barbuda</option>
        <option value="AR">Argentina</option>
        <option value="AM">Armenia</option>
        <option value="AW">Aruba</option>
        <option value="AU">Australia</option>
        <option value="AT">Austria</option>
        <option value="AZ">Azerbaijan</option>
        <option value="BS">Bahamas</option>
        <option value="BH">Bahrain</option>
        <option value="BD">Bangladesh</option>
        <option value="BB">Barbados</option>
        <option value="BY">Belarus</option>
        <option value="BE">Belgium</option>
        <option value="BZ">Belize</option>
        <option value="BJ">Benin</option>
        <option value="BM">Bermuda</option>
        <option value="BT">Bhutan</option>
        <option value="BO">Bolivia</option>
        <option value="BQ">Bonaire, Sint Eustatius and Saba</option>
        <option value="BA">Bosnia and Herzegovina</option>
        <option value="BW">Botswana</option>
        <option value="BV">Bouvet Island</option>
        <option value="BR">Brazil</option>
        <option value="IO">British Indian Ocean Territory</option>
        <option value="BN">Brunei Darussalam</option>
        <option value="BG">Bulgaria</option>
        <option value="BF">Burkina Faso</option>
        <option value="BI">Burundi</option>
        <option value="KH">Cambodia</option>
        <option value="CM">Cameroon</option>
        <option value="CA">Canada</option>
        <option value="CV">Cape Verde</option>
        <option value="KY">Cayman Islands</option>
        <option value="CF">Central African Republic</option>
        <option value="TD">Chad</option>
        <option value="CL">Chile</option>
        <option value="CN">China</option>
        <option value="CX">Christmas Island</option>
        <option value="CC">Cocos (Keeling) Islands</option>
        <option value="CO">Colombia</option>
        <option value="KM">Comoros</option>
        <option value="CG">Congo (Brazzaville)</option>
        <option value="CD">Congo (Kinshasa)</option>
        <option value="CK">Cook Islands</option>
        <option value="CR">Costa Rica</option>
        <option value="CI">Côte d'Ivoire</option>
        <option value="HR">Croatia</option>
        <option value="CW">Curaçao</option>
        <option value="CY">Cyprus</option>
        <option value="CZ">Czech Republic</option>
        <option value="DK">Denmark</option>
        <option value="DJ">Djibouti</option>
        <option value="DM">Dominica</option>
        <option value="DO">Dominican Republic</option>
        <option value="EC">Ecuador</option>
        <option value="EG">Egypt</option>
        <option value="SV">El Salvador</option>
        <option value="GQ">Equatorial Guinea</option>
        <option value="ER">Eritrea</option>
        <option value="EE">Estonia</option>
        <option value="ET">Ethiopia</option>
        <option value="FK">Falkland Islands</option>
        <option value="FO">Faroe Islands</option>
        <option value="FJ">Fiji</option>
        <option value="FI">Finland</option>
        <option value="FR">France</option>
        <option value="GF">French Guiana</option>
        <option value="PF">French Polynesia</option>
        <option value="TF">French Southern Lands</option>
        <option value="GA">Gabon</option>
        <option value="GM">Gambia</option>
        <option value="GE">Georgia</option>
        <option value="DE">Germany</option>
        <option value="GH">Ghana</option>
        <option value="GI">Gibraltar</option>
        <option value="GR">Greece</option>
        <option value="GL">Greenland</option>
        <option value="GD">Grenada</option>
        <option value="GP">Guadeloupe</option>
        <option value="GU">Guam</option>
        <option value="GT">Guatemala</option>
        <option value="GG">Guernsey</option>
        <option value="GN">Guinea</option>
        <option value="GW">Guinea-Bissau</option>
        <option value="GY">Guyana</option>
        <option value="HT">Haiti</option>
        <option value="HM">Heard and McDonald Islands</option>
        <option value="HN">Honduras</option>
        <option value="HK">Hong Kong</option>
        <option value="HU">Hungary</option>
        <option value="IS">Iceland</option>
        <option value="IN">India</option>
        <option value="ID">Indonesia</option>
        <option value="IR">Iran</option>
        <option value="IQ">Iraq</option>
        <option value="IE">Ireland</option>
        <option value="IM">Isle of Man</option>
        <option value="IL">Israel</option>
        <option value="IT">Italy</option>
        <option value="JM">Jamaica</option>
        <option value="JP">Japan</option>
        <option value="JE">Jersey</option>
        <option value="JO">Jordan</option>
        <option value="KZ">Kazakhstan</option>
        <option value="KE">Kenya</option>
        <option value="KI">Kiribati</option>
        <option value="KR">Korea, South</option>
        <option value="KW">Kuwait</option>
        <option value="KG">Kyrgyzstan</option>
        <option value="LA">Laos</option>
        <option value="LV">Latvia</option>
        <option value="LB">Lebanon</option>
        <option value="LS">Lesotho</option>
        <option value="LR">Liberia</option>
        <option value="LY">Libya</option>
        <option value="LI">Liechtenstein</option>
        <option value="LT">Lithuania</option>
        <option value="LU">Luxembourg</option>
        <option value="MO">Macau</option>
        <option value="MK">Macedonia</option>
        <option value="MG">Madagascar</option>
        <option value="MW">Malawi</option>
        <option value="MY">Malaysia</option>
        <option value="MV">Maldives</option>
        <option value="ML">Mali</option>
        <option value="MT">Malta</option>
        <option value="MH">Marshall Islands</option>
        <option value="MQ">Martinique</option>
        <option value="MR">Mauritania</option>
        <option value="MU">Mauritius</option>
        <option value="YT">Mayotte</option>
        <option value="MX">Mexico</option>
        <option value="FM">Micronesia</option>
        <option value="MD">Moldova</option>
        <option value="MC">Monaco</option>
        <option value="MN">Mongolia</option>
        <option value="ME">Montenegro</option>
        <option value="MS">Montserrat</option>
        <option value="MA">Morocco</option>
        <option value="MZ">Mozambique</option>
        <option value="MM">Myanmar</option>
        <option value="NA">Namibia</option>
        <option value="NR">Nauru</option>
        <option value="NP">Nepal</option>
        <option value="NL">Netherlands</option>
        <option value="NC">New Caledonia</option>
        <option value="NZ">New Zealand</option>
        <option value="NI">Nicaragua</option>
        <option value="NE">Niger</option>
        <option value="NG">Nigeria</option>
        <option value="NU">Niue</option>
        <option value="NF">Norfolk Island</option>
        <option value="MP">Northern Mariana Islands</option>
        <option value="NO">Norway</option>
        <option value="OM">Oman</option>
        <option value="PK">Pakistan</option>
        <option value="PW">Palau</option>
        <option value="PS">Palestine</option>
        <option value="PA">Panama</option>
        <option value="PG">Papua New Guinea</option>
        <option value="PY">Paraguay</option>
        <option value="PE">Peru</option>
        <option value="PH">Philippines</option>
        <option value="PN">Pitcairn</option>
        <option value="PL">Poland</option>
        <option value="PT">Portugal</option>
        <option value="PR">Puerto Rico</option>
        <option value="QA">Qatar</option>
        <option value="RE">Reunion</option>
        <option value="RO">Romania</option>
        <option value="RU">Russian Federation</option>
        <option value="RW">Rwanda</option>
        <option value="BL">Saint Barthélemy</option>
        <option value="SH">Saint Helena</option>
        <option value="KN">Saint Kitts and Nevis</option>
        <option value="LC">Saint Lucia</option>
        <option value="MF">Saint Martin (French part)</option>
        <option value="PM">Saint Pierre and Miquelon</option>
        <option value="VC">Saint Vincent and the Grenadines</option>
        <option value="WS">Samoa</option>
        <option value="SM">San Marino</option>
        <option value="ST">Sao Tome and Principe</option>
        <option value="SA">Saudi Arabia</option>
        <option value="SN">Senegal</option>
        <option value="RS">Serbia</option>
        <option value="SC">Seychelles</option>
        <option value="SL">Sierra Leone</option>
        <option value="SG">Singapore</option>
        <option value="SX">Sint Maarten (Dutch part)</option>
        <option value="SK">Slovakia</option>
        <option value="SI">Slovenia</option>
        <option value="SB">Solomon Islands</option>
        <option value="SO">Somalia</option>
        <option value="ZA">South Africa</option>
        <option value="GS">South Georgia and South Sandwich Islands</option>
        <option value="SS">South Sudan</option>
        <option value="ES">Spain</option>
        <option value="LK">Sri Lanka</option>
        <option value="SD">Sudan</option>
        <option value="SR">Suriname</option>
        <option value="SJ">Svalbard and Jan Mayen Islands</option>
        <option value="SZ">Swaziland</option>
        <option value="SE">Sweden</option>
        <option value="CH">Switzerland</option>
        <option value="TW">Taiwan</option>
        <option value="TJ">Tajikistan</option>
        <option value="TZ">Tanzania</option>
        <option value="TH">Thailand</option>
        <option value="TL">Timor-Leste</option>
        <option value="TG">Togo</option>
        <option value="TK">Tokelau</option>
        <option value="TO">Tonga</option>
        <option value="TT">Trinidad and Tobago</option>
        <option value="TN">Tunisia</option>
        <option value="TR">Turkey</option>
        <option value="TM">Turkmenistan</option>
        <option value="TC">Turks and Caicos Islands</option>
        <option value="TV">Tuvalu</option>
        <option value="UG">Uganda</option>
        <option value="UA">Ukraine</option>
        <option value="AE">United Arab Emirates</option>
        <option value="GB">United Kingdom</option>
        <option value="UM">United States Minor Outlying Islands</option>
        <option value="US">United States of America</option>
        <option value="UY">Uruguay</option>
        <option value="UZ">Uzbekistan</option>
        <option value="VU">Vanuatu</option>
        <option value="VA">Vatican City</option>
        <option value="VE">Venezuela</option>
        <option value="VN">Vietnam</option>
        <option value="VG">Virgin Islands, British</option>
        <option value="VI">Virgin Islands, U.S.</option>
        <option value="WF">Wallis and Futuna Islands</option>
        <option value="EH">Western Sahara</option>
        <option value="YE">Yemen</option>
        <option value="ZM">Zambia</option>
        <option value="ZW">Zimbabwe</option>
      </SelectField>
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

function formatDate(date: string, format: "relative" | "long" = "relative") {
  if ("RelativeTimeFormat" in Intl && format === "relative") {
    /* @ts-ignore */
    const rtf = new Intl.RelativeTimeFormat("en", {
      localeMatcher: "best fit",
      numeric: "auto",
      style: "long",
    });

    const ends = Math.ceil((new Date(date).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    return rtf.format(ends, "day");
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(new Date(date)));
}

function Banner({
  children,
  icon,
  type,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  type: "warning" | "primary";
}) {
  return (
    <div
      className={classNames("rounded-md flex flex-row items-center p-3 space-x-3", {
        "bg-primaryAccent text-white": type === "primary",
        "bg-yellow-300 text-black": type === "warning",
      })}
    >
      {icon}
      <span className="flex-grow">{children}</span>
    </div>
  );
}

function BillingBanners({ subscription }: { subscription: Subscription }) {
  if (subscription.plan.key === "beta-v1") {
    return (
      <Banner icon={<span className="text-3xl">😍</span>} type="primary">
        We’ve gifted you a team plan for being a beta tester. Thank you!
      </Banner>
    );
  }

  if (isSubscriptionCancelled(subscription)) {
    return (
      <Banner icon={<MaterialIcon>access_time</MaterialIcon>} type="warning">
        Subscription ends {formatDate(subscription.effectiveUntil!)}
      </Banner>
    );
  }

  const showTrialExpiration = getFeatureFlag("ui-trial-expiration", false);
  if (subscription.status === "trialing" && showTrialExpiration) {
    return (
      <Banner icon={<MaterialIcon>access_time</MaterialIcon>} type="warning">
        Trial ends {formatDate(subscription.trialEnds!)}
      </Banner>
    );
  }

  return null;
}

function SubscriptionDetails({
  subscription,
  onAddPaymentMethod,
}: {
  subscription: Subscription;
  onAddPaymentMethod: () => void;
}) {
  return (
    <section>
      <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
        <span>Current Plan</span>
        <span>{getPlanDisplayText(subscription)}</span>
      </div>
      <ExpirationRow subscription={subscription} label="Expiration" />
      <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
        <span>Number of seats</span>
        <span>{subscription.seatCount}</span>
      </div>
      {isSubscriptionCancelled(subscription) ? null : (
        <div className="py-2 border-b border-color-gray-50 flex flex-row items-center justify-between">
          <span>Payment Method</span>
          <span>
            {subscription.paymentMethods.length > 0 ? (
              `${cardToDisplayType(subscription.paymentMethods[0].card.brand)} ending with ${
                subscription.paymentMethods[0].card.last4
              }`
            ) : (
              <button className="text-primaryAccent hover:underline" onClick={onAddPaymentMethod}>
                Add Payment Method
              </button>
            )}
          </span>
        </div>
      )}
    </section>
  );
}

function ConsentForm({
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

function Confirmation({ subscription }: { subscription: Subscription }) {
  return (
    <section>
      {/* <div className="h-36 mb-6 rounded-lg bg-blue-100" /> */}
      <PlanDetails subscription={subscription} />
    </section>
  );
}

function CancelSubscription({
  subscription,
  workspaceId,
}: {
  subscription: Subscription;
  workspaceId: string;
}) {
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

  if (subscription.status !== "active" && subscription.status !== "trialing") {
    return null;
  }

  return (
    <section className="space-y-4">
      <h3 className="border-b py-2 text-lg font-bold">Danger Zone</h3>
      <div className="border border-red-300 flex flex-row items-center justify-between rounded-lg p-3 space-x-3">
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
  );
}

export default function WorkspaceSubscription({ workspaceId }: { workspaceId: string }) {
  const [view, setView] = useState<Views>("details");
  const { data, loading } = hooks.useGetWorkspaceSubscription(workspaceId);

  if (loading) return null;

  if (!data?.node.subscription) {
    return (
      <section className="space-y-8">
        <p>This team does not have an active subscription</p>
      </section>
    );
  }

  return (
    <>
      <SettingsHeader>{getViewTitle(view)}</SettingsHeader>
      <section className="space-y-6 overflow-y-auto" style={{ marginRight: -16, paddingRight: 16 }}>
        {view === "details" ? (
          <>
            <BillingBanners subscription={data.node.subscription} />
            <SubscriptionDetails
              subscription={data.node.subscription}
              onAddPaymentMethod={() => setView("add-payment-method")}
            />
            <CancelSubscription subscription={data.node.subscription} workspaceId={workspaceId} />
          </>
        ) : null}
        {view === "add-payment-method" ? (
          <ConsentForm
            subscription={data.node.subscription}
            onEnterCard={() => setView("enter-payment-method")}
          />
        ) : null}
        {view === "enter-payment-method" ? (
          <Elements stripe={stripePromise}>
            <AddPaymentMethod
              onCancel={() => setView("details")}
              onSave={() => setView("confirm-payment-method")}
              workspaceId={workspaceId}
            />
          </Elements>
        ) : null}
        {view === "confirm-payment-method" ? (
          <Confirmation subscription={data.node.subscription} />
        ) : null}
      </section>
    </>
  );
}
