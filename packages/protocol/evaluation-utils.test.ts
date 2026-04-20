import { getFunctionBody, replaceMultipleStrings } from "./evaluation-utils";

describe("evaluation-utils", () => {
  describe("getFunctionBody", () => {
    it("returns inner statements without the wrapping function braces", () => {
      const fn = function example() {
        const n = 1;
        return n + 1;
      };
      const body = getFunctionBody(fn);
      expect(body).toContain("const n = 1");
      expect(body).toContain("return n + 1");
      expect(body.trim().startsWith("function")).toBe(false);
    });

    it("strips line comments from the serialized function", () => {
      const fn = function withComment() {
        // should disappear
        return 42;
      };
      const body = getFunctionBody(fn);
      expect(body).not.toMatch(/\/\/ should disappear/);
      expect(body).toContain("return 42");
    });

    it("strips block comments from the serialized function", () => {
      const fn = function withBlock() {
        /* block */
        return 7;
      };
      const body = getFunctionBody(fn);
      expect(body).not.toMatch(/\/\* block \*\//);
      expect(body).toContain("return 7");
    });
  });

  describe("replaceMultipleStrings", () => {
    it("applies each replacement in order", () => {
      expect(
        replaceMultipleStrings("alpha beta", {
          alpha: "A",
          beta: "B",
        })
      ).toBe("A B");
    });

    it("only replaces the first occurrence per search string (non-global)", () => {
      expect(replaceMultipleStrings("x x", { x: "y" })).toBe("y x");
    });
  });
});
