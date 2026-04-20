import { commaListOfThings, compareBigInt, isValidTeamName, validateEmail } from "./helpers";

describe("helpers", () => {
  describe("validateEmail", () => {
    it("accepts a minimal valid address shape", () => {
      expect(validateEmail("a@b.co")).toBe(true);
    });

    it("rejects strings without a domain", () => {
      expect(validateEmail("not-an-email")).toBe(false);
      expect(validateEmail("@nodomain")).toBe(false);
    });
  });

  describe("compareBigInt", () => {
    it("returns -1, 0, or 1 like a comparator", () => {
      expect(compareBigInt(1n, 2n)).toBe(-1);
      expect(compareBigInt(2n, 1n)).toBe(1);
      expect(compareBigInt(5n, 5n)).toBe(0);
    });
  });

  describe("commaListOfThings", () => {
    it("returns undefined for empty input", () => {
      expect(commaListOfThings([])).toBeUndefined();
    });

    it("returns the sole element for a single-item list", () => {
      expect(commaListOfThings(["only"])).toBe("only");
    });

    it("joins two items with 'and'", () => {
      expect(commaListOfThings(["a", "b"])).toBe("a, and b");
    });

    it("joins three or more with Oxford-style comma before final and", () => {
      expect(commaListOfThings(["a", "b", "c"])).toBe("a, b, and c");
    });
  });

  describe("isValidTeamName", () => {
    it("rejects whitespace-only names", () => {
      expect(isValidTeamName("   ")).toBe(false);
      expect(isValidTeamName("\t")).toBe(false);
    });

    it("accepts non-empty trimmed names", () => {
      expect(isValidTeamName("Engineering")).toBe(true);
      expect(isValidTeamName("  Team  ")).toBe(true);
    });
  });
});
