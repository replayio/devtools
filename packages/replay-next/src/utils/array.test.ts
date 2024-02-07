import {
  findIndex,
  findIndexBigInt,
  findIndexGTE,
  findIndexLTE,
  findIndexString,
  insert,
  insertString,
} from "./array";

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

  describe("findIndexGTE", () => {
    const compare = (a: number, b: number) => {
      if (a === b) {
        return 0;
      } else {
        return a > b ? 1 : -1;
      }
    };

    it("should return -1 if no match can be found", () => {
      expect(findIndexGTE([], 1, compare)).toBe(-1);
      expect(findIndexGTE([2], 3, compare)).toBe(-1);
    });

    it("should return the smallest match that is gte the specified item", () => {
      expect(findIndexGTE([1, 5, 25], 25, compare)).toBe(2);
      expect(findIndexGTE([1, 5, 25], 24, compare)).toBe(2);
      expect(findIndexGTE([1, 5, 25], 6, compare)).toBe(2);

      expect(findIndexGTE([1, 5, 25], 5, compare)).toBe(1);
      expect(findIndexGTE([1, 5, 25], 4, compare)).toBe(1);
      expect(findIndexGTE([1, 5, 25], 2, compare)).toBe(1);

      expect(findIndexGTE([1, 5, 25], 1, compare)).toBe(0);
      expect(findIndexGTE([1, 5, 25], 0, compare)).toBe(0);
    });
  });

  describe("findIndexLTE", () => {
    const compare = (a: number, b: number) => {
      if (a === b) {
        return 0;
      } else {
        return a > b ? 1 : -1;
      }
    };

    it("should return -1 if no match can be found", () => {
      expect(findIndexLTE([], 1, compare)).toBe(-1);
      expect(findIndexLTE([2], 1, compare)).toBe(-1);
    });

    it("should return the largest match that is lte the specified item", () => {
      expect(findIndexLTE([1, 5, 25], 1, compare)).toBe(0);
      expect(findIndexLTE([1, 5, 25], 2, compare)).toBe(0);
      expect(findIndexLTE([1, 5, 25], 4, compare)).toBe(0);

      expect(findIndexLTE([1, 5, 25], 5, compare)).toBe(1);
      expect(findIndexLTE([1, 5, 25], 6, compare)).toBe(1);
      expect(findIndexLTE([1, 5, 25], 24, compare)).toBe(1);

      expect(findIndexLTE([1, 5, 25], 25, compare)).toBe(2);
      expect(findIndexLTE([1, 5, 25], 26, compare)).toBe(2);
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
