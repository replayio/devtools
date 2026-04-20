import { comparePoints, pointEquals, pointPrecedes } from "./execution-point-utils";

describe("execution-point-utils", () => {
  describe("pointEquals", () => {
    it("returns true for identical string points", () => {
      expect(pointEquals("100", "100")).toBe(true);
    });

    it("returns false for different points", () => {
      expect(pointEquals("100", "101")).toBe(false);
    });
  });

  describe("pointPrecedes / comparePoints", () => {
    it("orders by length first (shorter numeric string is smaller)", () => {
      expect(pointPrecedes("9", "10")).toBe(true);
      expect(pointPrecedes("10", "9")).toBe(false);
      expect(comparePoints("9", "10")).toBe(-1);
      expect(comparePoints("10", "9")).toBe(1);
    });

    it("uses lexicographic order when lengths match", () => {
      expect(comparePoints("12", "34")).toBe(-1);
      expect(comparePoints("34", "12")).toBe(1);
      expect(comparePoints("99", "99")).toBe(0);
      expect(pointPrecedes("12", "34")).toBe(true);
    });
  });
});
