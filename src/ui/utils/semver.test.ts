import { gt, gte, semvercmp } from "./semver";

describe("semver", () => {
  describe("semvercmp", () => {
    it("orders major.minor.patch numerically", () => {
      expect(semvercmp("1.0.0", "2.0.0")).toBe(-1);
      expect(semvercmp("2.0.0", "1.0.0")).toBe(1);
      expect(semvercmp("1.2.3", "1.2.3")).toBe(0);
      expect(semvercmp("1.2.0", "1.10.0")).toBe(-1);
    });

    it("treats NaN segment as less than a numeric segment", () => {
      expect(semvercmp("1.0.0", "1.0.x")).toBe(1);
      expect(semvercmp("1.0.x", "1.0.0")).toBe(-1);
    });
  });

  describe("gt / gte", () => {
    it("gt is strict ordering", () => {
      expect(gt("2.0.0", "1.0.0")).toBe(true);
      expect(gt("1.0.0", "1.0.0")).toBe(false);
    });

    it("gte includes equality", () => {
      expect(gte("1.0.0", "1.0.0")).toBe(true);
      expect(gte("1.0.1", "1.0.0")).toBe(true);
      expect(gte("1.0.0", "1.0.1")).toBe(false);
    });
  });
});
