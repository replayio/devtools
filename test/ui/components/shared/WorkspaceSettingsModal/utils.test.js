const {
  getSubscriptionWithPricing,
  cycleCharge,
} = require("ui/components/shared/WorkspaceSettingsModal/utils");

describe("subscriptionWithPricing", () => {
  test("will return team pricing if the plan key is team-v1", () => {
    expect(getSubscriptionWithPricing({ plan: { key: "team-v1" } })).toEqual({
      billingSchedule: "monthly",
      discount: 0,
      displayName: "Team",
      plan: { key: "team-v1" },
      seatPrice: 20,
      trial: false,
    });
  });

  test("will return org pricing if the plan key is org-v1", () => {
    expect(getSubscriptionWithPricing({ plan: { key: "org-v1" } })).toEqual({
      billingSchedule: "monthly",
      discount: 0,
      displayName: "Organization",
      plan: { key: "org-v1" },
      seatPrice: 75,
      trial: false,
    });
  });
});

describe("cycleCharge", () => {
  test("will return the seatCount * seatPrice when billing monthly", () => {
    expect(
      cycleCharge({ billingSchedule: "monthly", discount: 0, seatCount: 5, seatPrice: 25 })
    ).toEqual("$125.00");
  });

  test("will return the seatCount * seatPrice when billing monthly", () => {
    expect(
      cycleCharge({ billingSchedule: "monthly", discount: 0.1, seatCount: 5, seatPrice: 25 })
    ).toEqual("$112.50");
  });

  test("will return the seatCount * seatPrice * 12 when billing annually", () => {
    expect(
      cycleCharge({ billingSchedule: "annual", discount: 0, seatCount: 5, seatPrice: 25 })
    ).toEqual("$1,500.00");
  });

  test("will apply the discount for the seatCount * seatPrice * 12 when billing annually", () => {
    expect(
      cycleCharge({ billingSchedule: "annual", discount: 0.1, seatCount: 5, seatPrice: 25 })
    ).toEqual("$1,350.00");
  });
});
