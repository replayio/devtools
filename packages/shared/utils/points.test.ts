import { isValidPoint } from "./points";

describe("isValidPoint", () => {
  it("accepts objects with required own properties", () => {
    expect(
      isValidPoint({
        badge: null,
        condition: "",
        content: "",
      })
    ).toBe(true);
  });

  it("rejects primitives and null", () => {
    expect(isValidPoint(null)).toBe(false);
    expect(isValidPoint(undefined)).toBe(false);
    expect(isValidPoint("x")).toBe(false);
  });

  it("rejects objects missing a required key", () => {
    expect(isValidPoint({ badge: 1, condition: "" })).toBe(false);
    expect(isValidPoint({ badge: 1, content: "" })).toBe(false);
    expect(isValidPoint({ condition: "", content: "" })).toBe(false);
  });

  it("rejects objects that only inherit required keys from the prototype", () => {
    const proto = { badge: 1, condition: "", content: "" };
    const o = Object.create(proto);
    expect(isValidPoint(o)).toBe(false);
  });
});
