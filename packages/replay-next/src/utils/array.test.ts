import { findIndex, findIndexBigInt, findIndexString, insert, insertString, slice } from "./array";

describe("array utils", () => {
  describe("findIndex", () => {
    const compare = (a: number, b: number) => {
      if (a === b) {
        return 0;
      } else {
        return a > b ? 1 : -1;
      }
    };

    it("should return -1 if the item is not in the array", () => {
      expect(findIndex([], 0, compare)).toEqual(-1);
      expect(findIndex([0], 1, compare)).toEqual(-1);
      expect(findIndex([1, 2], 0, compare)).toEqual(-1);
    });

    it("should find item index", () => {
      const array = [1, 25, 100, 2500];

      expect(findIndex(array, 1, compare)).toEqual(0);
      expect(findIndex(array, 25, compare)).toEqual(1);
      expect(findIndex(array, 100, compare)).toEqual(2);
      expect(findIndex(array, 2500, compare)).toEqual(3);
    });

    describe("closest match", () => {
      const compare = (a: number, b: number) => a - b;

      it("should return -1 for empty arrays", () => {
        expect(findIndex([], 0, compare)).toEqual(-1);
      });

      it("should find the closest item index", () => {
        const array = [1, 25, 100, 2500];

        expect(findIndex(array, -1, compare, false)).toEqual(0);
        expect(findIndex(array, 0, compare, false)).toEqual(0);
        expect(findIndex(array, 1, compare, false)).toEqual(0);
        expect(findIndex(array, 2, compare, false)).toEqual(0);

        expect(findIndex(array, 20, compare, false)).toEqual(1);
        expect(findIndex(array, 25, compare, false)).toEqual(1);
        expect(findIndex(array, 50, compare, false)).toEqual(1);

        expect(findIndex(array, 2000, compare, false)).toEqual(3);
        expect(findIndex(array, 2500, compare, false)).toEqual(3);
        expect(findIndex(array, 3000, compare, false)).toEqual(3);
      });

      it("should handle arrays of different parities", () => {
        expect(findIndex([1], 0, compare, false)).toEqual(0);
        expect(findIndex([1], 2, compare, false)).toEqual(0);

        expect(findIndex([1, 2], 0, compare, false)).toEqual(0);
        expect(findIndex([1, 2], 3, compare, false)).toEqual(1);

        // Ambiguous case!
        expect(findIndex([1, 3], 2, compare, false)).toEqual(1);
      });
    });
  });

  describe("findIndexBigInt", () => {
    const bigints = [
      "0",
      "1000000000000000000000000000000000",
      "2000000000000000000000000000000000",
      "10000000000000000000000000000000000",
      "15000000000000000000000000000000000",
    ];

    it("should find the matching index of bit integers", () => {
      expect(findIndexBigInt(bigints, "0")).toBe(0);
      expect(findIndexBigInt(bigints, "1000000000000000000000000000000000")).toBe(1);
      expect(findIndexBigInt(bigints, "2000000000000000000000000000000000")).toBe(2);
      expect(findIndexBigInt(bigints, "10000000000000000000000000000000000")).toBe(3);
      expect(findIndexBigInt(bigints, "15000000000000000000000000000000000")).toBe(4);
    });

    it("should find the closest index of bit integers", () => {
      expect(findIndexBigInt(bigints, "50000000000000000000000000000000", false)).toBe(0);
      expect(findIndexBigInt(bigints, "800000000000000000000000000000000", false)).toBe(1);
      expect(findIndexBigInt(bigints, "1100000000000000000000000000000000", false)).toBe(1);
      expect(findIndexBigInt(bigints, "1600000000000000000000000000000000", false)).toBe(2);
      expect(findIndexBigInt(bigints, "5000000000000000000000000000000000", false)).toBe(2);
      expect(findIndexBigInt(bigints, "13000000000000000000000000000000000", false)).toBe(4);
      expect(findIndexBigInt(bigints, "25000000000000000000000000000000000", false)).toBe(4);
    });
  });

  describe("slice", () => {
    const compare = (a: number, b: number) => {
      return a - b;
    };

    it("should handle empty arrays", () => {
      expect(slice([], 0, 5, compare)).toEqual([]);
    });

    it("should handle arrays with no values in range", () => {
      expect(slice([1], 5, 7, compare)).toEqual([]);
      expect(slice([9], 5, 7, compare)).toEqual([]);
      expect(slice([1, 2], 5, 7, compare)).toEqual([]);
      expect(slice([8, 9], 5, 7, compare)).toEqual([]);
      expect(slice([1, 2, 3], 5, 7, compare)).toEqual([]);
      expect(slice([7, 8, 9], 5, 6, compare)).toEqual([]);
    });

    it("should handle arrays with all values in range", () => {
      expect(slice([4], 1, 10, compare)).toEqual([4]);
      expect(slice([4, 6], 1, 10, compare)).toEqual([4, 6]);
      expect(slice([4, 6, 7], 1, 10, compare)).toEqual([4, 6, 7]);
    });

    it("should handle arrays with partial values in range", () => {
      expect(slice([1, 2], 0, 1, compare)).toEqual([1]);
      expect(slice([4, 5], 5, 7, compare)).toEqual([5]);
      expect(slice([1, 2, 3], 0, 1, compare)).toEqual([1]);
      expect(slice([3, 4, 5], 5, 8, compare)).toEqual([5]);
      expect(slice([1, 2, 3, 4, 5, 6, 7, 8, 9], 0, 3, compare)).toEqual([1, 2, 3]);
      expect(slice([1, 2, 3, 4, 5, 6, 7, 8, 9], 5, 6, compare)).toEqual([5, 6]);
      expect(slice([1, 2, 3, 4, 5, 6, 7, 8, 9], 5, 5, compare)).toEqual([5]);
      expect(slice([1, 2, 3, 4, 5, 6, 7, 8, 9], 8, 15, compare)).toEqual([8, 9]);
    });
  });

  describe("findIndexString", () => {
    it("should return -1 if the item is not in the array", () => {
      expect(findIndexString([], "z")).toEqual(-1);
      expect(findIndexString(["a"], "z")).toEqual(-1);
      expect(findIndexString(["a", "b"], "z")).toEqual(-1);
    });

    it("should find item index", () => {
      const array = ["b", "e", "f", "g", "j"];

      expect(findIndexString(array, "b")).toEqual(0);
      expect(findIndexString(array, "e")).toEqual(1);
      expect(findIndexString(array, "f")).toEqual(2);
      expect(findIndexString(array, "g")).toEqual(3);
      expect(findIndexString(array, "j")).toEqual(4);
    });
  });

  describe("insert", () => {
    it("should maintain an ordered array", () => {
      const array: number[] = [];
      const compare = (a: number, b: number) => a - b;

      expect(insert(array, 4, compare)).toEqual([4]);
      expect(insert(array, 1, compare)).toEqual([1, 4]);
      expect(insert(array, 3, compare)).toEqual([1, 3, 4]);
      expect(insert(array, 0, compare)).toEqual([0, 1, 3, 4]);
      expect(insert(array, 2, compare)).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe("insertString", () => {
    it("should maintain an ordered array", () => {
      const array: string[] = [];
      expect(insertString(array, "b")).toEqual(["b"]);
      expect(insertString(array, "d")).toEqual(["b", "d"]);
      expect(insertString(array, "c")).toEqual(["b", "c", "d"]);
      expect(insertString(array, "a")).toEqual(["a", "b", "c", "d"]);
      expect(insertString(array, "e")).toEqual(["a", "b", "c", "d", "e"]);
    });
  });
});
