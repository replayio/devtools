import {
  arrayShallowEqual,
  shallowEqual,
  strictEqual,
} from "./compare";

describe("compare", () => {
  describe("strictEqual", () => {
    it("uses === semantics", () => {
      expect(strictEqual(1, 1)).toBe(true);
      expect(strictEqual(1, "1" as unknown as number)).toBe(false);
      expect(strictEqual(NaN, NaN)).toBe(false);
    });
  });

  describe("shallowEqual", () => {
    it("compares primitives with ===", () => {
      expect(shallowEqual(3, 3)).toBe(true);
      expect(shallowEqual(3, 4)).toBe(false);
    });

    it("compares arrays element-wise with ===", () => {
      expect(shallowEqual([1, "a"], [1, "a"])).toBe(true);
      expect(shallowEqual([1, {}], [1, {}])).toBe(false);
      expect(shallowEqual([1], [1, 2])).toBe(false);
    });

    it("compares plain objects by same keys in insertion order and values with ===", () => {
      expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
      expect(shallowEqual({ a: {} }, { a: {} })).toBe(false);
    });
  });

  describe("arrayShallowEqual", () => {
    it("requires same length and strict element equality", () => {
      expect(arrayShallowEqual([], [])).toBe(true);
      expect(arrayShallowEqual([0, 1], [0, 1])).toBe(true);
      expect(arrayShallowEqual([0], [0, 1])).toBe(false);
    });
  });
});
