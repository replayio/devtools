import { canRunLocalAnalysis } from "./AnalysisCache";

describe("AnalysisCache", () => {
  describe("canRunLocalAnalysis", () => {
    test("should support empty strings", () => {
      expect(canRunLocalAnalysis("")).toBe(true);
    });

    test("should support specific keywords", () => {
      expect(canRunLocalAnalysis("null")).toBe(true);
      expect(canRunLocalAnalysis("undefined")).toBe(true);
      expect(canRunLocalAnalysis("false")).toBe(true);
      expect(canRunLocalAnalysis("true")).toBe(true);
      expect(canRunLocalAnalysis("NaN")).toBe(true);
      expect(canRunLocalAnalysis("Infinity")).toBe(true);

      expect(canRunLocalAnalysis("  true")).toBe(true);
      expect(canRunLocalAnalysis("true ")).toBe(true);
    });

    test("should support simple strings", () => {
      expect(canRunLocalAnalysis('"This is a test string"')).toBe(true);
      expect(canRunLocalAnalysis("'This is a test string as well'")).toBe(true);
      expect(canRunLocalAnalysis(`"An apostrophe shouldn't interfere with this string"`)).toBe(
        true
      );
      expect(canRunLocalAnalysis("`This string has no substitions, only some currency $1.`")).toBe(
        true
      );

      expect(canRunLocalAnalysis(' "This is a test string"  ')).toBe(true);
    });

    test("should support combinations of keywords and strings", () => {
      expect(canRunLocalAnalysis('"source.html", 123')).toBe(true);
      expect(canRunLocalAnalysis("false, true")).toBe(true);
      expect(canRunLocalAnalysis('"source.html", 123, true, false')).toBe(true);

      expect(canRunLocalAnalysis(' "source.html", 123,  true , false  ')).toBe(true);
    });

    test("should fail for strings that might have substitution params", () => {
      expect(canRunLocalAnalysis("`Test ${variable} here.`")).toBe(false);
    });

    test("should fail for unsupported keywords/identifiers", () => {
      expect(canRunLocalAnalysis("Date.now()")).toBe(false);
      expect(canRunLocalAnalysis("new Error()")).toBe(false);
      expect(canRunLocalAnalysis("window.location")).toBe(false);
      expect(canRunLocalAnalysis("location.href")).toBe(false);
      expect(canRunLocalAnalysis("document")).toBe(false);
    });
  });
});
