const { fullPricingDetailsForSubscription, cycleCharge } = require("ui/utils/billing");

describe("fullPricingDetailsForSubscription", () => {
  test("will return team pricing if the plan key is team-v1", () => {
    expect(fullPricingDetailsForSubscription({ plan: { key: "team-v1" } })).toEqual({
      plan: { key: "team-v1" },
      billingSchedule: "monthly",
      seatPrice: 20,
    });
  });

  test("will return org pricing if the plan key is org-v1", () => {
    expect(fullPricingDetailsForSubscription({ plan: { key: "org-v1" } })).toEqual({
      plan: { key: "org-v1" },
      billingSchedule: "monthly",
      seatPrice: 75,
    });
  });
});

describe("cycleCharge", () => {
  test("will return the seatCount * seatPrice when billing monthly", () => {
    expect(cycleCharge({ seatCount: 5, seatPrice: 25, billingSchedule: "monthly" })).toEqual(
      5 * 25
    );
  });

  test("will return the seatCount * seatPrice * 12 when billing annually", () => {
    expect(cycleCharge({ seatCount: 5, seatPrice: 25, billingSchedule: "annual" })).toEqual(
      5 * 25 * 12
    );
  });
});
