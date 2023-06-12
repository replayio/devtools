import { truncateMiddle } from "replay-next/src/utils/string";

describe("string util", () => {
  describe("truncateMiddle", () => {
    it("should handle empty strings", () => {
      expect(truncateMiddle("", 10)).toEqual("");
    });

    it("should not truncate strings that are <= the specified maximum length", () => {
      expect(truncateMiddle("one", 5)).toEqual("one");
      expect(truncateMiddle("three", 5)).toEqual("three");
    });

    it("should truncate strings that are > than the specified length", () => {
      expect(truncateMiddle("1234567890123456", 10)).toEqual("1234...3456");
      expect(truncateMiddle("123456789012345", 10)).toEqual("1234...2345");
      expect(truncateMiddle("1234567890123456", 9)).toEqual("123...456");
      expect(truncateMiddle("123456789012345", 9)).toEqual("123...345");
    });
  });
});
