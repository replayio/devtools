import { canRunLocalAnalysis } from "./LogPointAnalysisCache";

describe("AnalysisCache", () => {
  describe("canRunLocalAnalysis", () => {
    test("should support empty strings", () => {
      expect(canRunLocalAnalysis("", null)).toBe(true);
    });

    test("should support specific keywords", () => {
      expect(canRunLocalAnalysis("null", null)).toBe(true);
      expect(canRunLocalAnalysis("undefined", null)).toBe(true);
      expect(canRunLocalAnalysis("false", null)).toBe(true);
      expect(canRunLocalAnalysis("true", null)).toBe(true);
      expect(canRunLocalAnalysis("NaN", null)).toBe(true);
      expect(canRunLocalAnalysis("Infinity", null)).toBe(true);

      expect(canRunLocalAnalysis("  true", null)).toBe(true);
      expect(canRunLocalAnalysis("true ", null)).toBe(true);
    });

    test("should support simple strings", () => {
      expect(canRunLocalAnalysis('"This is a test string"', null)).toBe(true);
      expect(canRunLocalAnalysis("'This is a test string as well'", null)).toBe(true);
      expect(
        canRunLocalAnalysis(`"An apostrophe shouldn't interfere with this string"`, null)
      ).toBe(true);
      expect(
        canRunLocalAnalysis("`This string has no substitions, only some currency $1.`", null)
      ).toBe(true);

      expect(canRunLocalAnalysis(' "This is a test string"  ', null)).toBe(true);
    });

    test("should support combinations of keywords and strings", () => {
      expect(canRunLocalAnalysis('"source.html", 123', null)).toBe(true);
      expect(canRunLocalAnalysis("false, true", null)).toBe(true);
      expect(canRunLocalAnalysis('"source.html", 123, true, false', null)).toBe(true);

      expect(canRunLocalAnalysis(' "source.html", 123,  true , false  ', null)).toBe(true);
    });

    test("should fail for strings that might have substitution params", () => {
      expect(canRunLocalAnalysis("`Test ${variable} here.`", null)).toBe(false);
    });

    test("should fail for unsupported keywords/identifiers", () => {
      expect(canRunLocalAnalysis("Date.now()", null)).toBe(false);
      expect(canRunLocalAnalysis("new Error()", null)).toBe(false);
      expect(canRunLocalAnalysis("window.location", null)).toBe(false);
      expect(canRunLocalAnalysis("location.href", null)).toBe(false);
      expect(canRunLocalAnalysis("document", null)).toBe(false);
    });

    test("should fail if there is a condition", () => {
      expect(canRunLocalAnalysis("null", "null")).toBe(false);
    });

    test("should fail for inline arrays", () => {
      expect(canRunLocalAnalysis('[123, "abc"]', null)).toBe(true);
      expect(canRunLocalAnalysis("[123, foo]", null)).toBe(false);
      expect(canRunLocalAnalysis("[foo, 123]", null)).toBe(false);
      expect(canRunLocalAnalysis('"abc", [123, "abc"]', null)).toBe(true);
      expect(canRunLocalAnalysis('"abc", [123, foo]', null)).toBe(false);
      expect(canRunLocalAnalysis('[123, ["abc"]]', null)).toBe(true);
      expect(canRunLocalAnalysis("[123, [foo]]", null)).toBe(false);

      // Ideally these cases would be true but detecting them via a syntax parser is complex,
      // and our parser should err on the side of caution
      expect(canRunLocalAnalysis("[123, {foo: 123}]", null)).toBe(false);
    });

    test("should properly handle inline objects", () => {
      expect(canRunLocalAnalysis("{foo}", null)).toBe(false);
      expect(canRunLocalAnalysis("{foo: 123}", null)).toBe(true);
      expect(canRunLocalAnalysis("{foo: bar}", null)).toBe(false);
      expect(canRunLocalAnalysis("123, {foo}", null)).toBe(false);
      expect(canRunLocalAnalysis("123, {foo: bar}", null)).toBe(false);
      expect(canRunLocalAnalysis("{foo: {bar}}", null)).toBe(false);

      // Ideally these cases would be true but detecting them via a syntax parser is complex,
      // and our parser should err on the side of caution
      expect(canRunLocalAnalysis("123, {foo: 123}", null)).toBe(false);
      expect(canRunLocalAnalysis("123, {foo: [1,2,3]}", null)).toBe(false);
    });
  });
});
