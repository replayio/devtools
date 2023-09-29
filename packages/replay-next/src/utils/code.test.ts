import { validateCode } from "replay-next/src/utils/code";

describe("code utils", () => {
  describe("validateCode", () => {
    it("should reject invalid code", () => {
      expect(validateCode("a`1")).toBe(false);
      expect(validateCode("{a")).toBe(false);
      expect(validateCode("a}")).toBe(false);
      expect(validateCode("{a]")).toBe(false);
      expect(validateCode("[")).toBe(false);
    });

    it("should handle simple primitives", () => {
      expect(validateCode("variable")).toBe(true);
      expect(validateCode('"string"')).toBe(true);
      expect(validateCode("'string'")).toBe(true);
      expect(validateCode("123")).toBe(true);
      expect(validateCode("true")).toBe(true);
      expect(validateCode("false")).toBe(true);
    });

    it("should handle template strings", () => {
      expect(validateCode("`string`")).toBe(true);
      expect(validateCode("`string ${variable}`")).toBe(true);
      expect(validateCode("`${1 + 2 + 3} string`")).toBe(true);
    });

    it("should handle inline arrays", () => {
      expect(validateCode("[variable, 123, 'string']")).toBe(true);
      expect(validateCode("[[]]")).toBe(true);
    });

    it("should handle inline objects", () => {
      expect(validateCode("{}")).toBe(true);
      expect(validateCode("{foo: 123}")).toBe(true);
      expect(validateCode('{foo: 123, bar: "abc"}')).toBe(true);
    });
  });
});
