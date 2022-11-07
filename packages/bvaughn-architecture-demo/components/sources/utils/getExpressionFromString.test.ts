import getExpressionFromString from "./getExpressionFromString";

// Converts a string like: "foo |bar"
// Into the string "foo bar" and the cursor index 4
function getExpressionHelper(expression: string): string | null {
  let text = expression;
  let cursorIndex = expression.length;

  for (let index = 0; index < expression.length; index++) {
    const character = expression.charAt(index);
    if (character === "|") {
      cursorIndex = index;

      text = expression.substring(0, index) + expression.substring(index + 1);
      break;
    }
  }

  return getExpressionFromString(text, cursorIndex);
}

describe("getExpressionFromString", () => {
  it("should handle empty or all-whitespace strings", () => {
    expect(getExpressionHelper("|")).toBe(null);
    expect(getExpressionHelper(" |")).toBe(null);
    expect(getExpressionHelper(" | ")).toBe(null);
  });

  it("should not try to auto-complete empty tokens", () => {
    expect(getExpressionHelper("foo |")).toBe(null);
  });

  it("should parse expressions up to the current cursor location", () => {
    expect(getExpressionHelper("|foo")).toBe("foo");
    expect(getExpressionHelper("f|oo")).toBe("foo");
    expect(getExpressionHelper("fo|o")).toBe("foo");
    expect(getExpressionHelper("foo|")).toBe("foo");
    expect(getExpressionHelper("foo| ")).toBe("foo");
  });

  it("should not include previous tokens", () => {
    expect(getExpressionHelper("foo |bar")).toBe("bar");
    expect(getExpressionHelper("foo b|ar")).toBe("bar");
    expect(getExpressionHelper("foo ba|r")).toBe("bar");
    expect(getExpressionHelper("foo bar|")).toBe("bar");
    expect(getExpressionHelper("foo bar| ")).toBe("bar");
  });

  it("should include tokens joined by periods", () => {
    expect(getExpressionHelper("foo bar.|baz")).toBe("bar.baz");
    expect(getExpressionHelper("foo bar.b|az")).toBe("bar.baz");
    expect(getExpressionHelper("foo bar.ba|z")).toBe("bar.baz");
    expect(getExpressionHelper("foo bar.baz|")).toBe("bar.baz");
    expect(getExpressionHelper("foo bar.baz| ")).toBe("bar.baz");
  });

  it("should not consider booleans auto-completeable expressions", () => {
    expect(getExpressionHelper("|true")).toBe(null);
    expect(getExpressionHelper("t|rue")).toBe(null);
    expect(getExpressionHelper("tr|ue")).toBe(null);
    expect(getExpressionHelper("tru|e")).toBe(null);
    expect(getExpressionHelper("true|")).toBe(null);
    expect(getExpressionHelper("true| ")).toBe(null);

    expect(getExpressionHelper("|false")).toBe(null);
    expect(getExpressionHelper("f|alse")).toBe(null);
    expect(getExpressionHelper("fa|lse")).toBe(null);
    expect(getExpressionHelper("fal|se")).toBe(null);
    expect(getExpressionHelper("fals|e")).toBe(null);
    expect(getExpressionHelper("false|")).toBe(null);
    expect(getExpressionHelper("false| ")).toBe(null);
  });

  it("should not consider numbers auto-completeable expressions", () => {
    expect(getExpressionHelper("|12")).toBe(null);
    expect(getExpressionHelper("1|2")).toBe(null);
    expect(getExpressionHelper("12|")).toBe(null);
    expect(getExpressionHelper("1.|12")).toBe(null);
    expect(getExpressionHelper("1.1|2")).toBe(null);
    expect(getExpressionHelper("1.12|")).toBe(null);
  });

  it("should not return expressions that are part of a string", () => {
    expect(getExpressionHelper('"|foo')).toBe(null);
    expect(getExpressionHelper('"f|oo')).toBe(null);
    expect(getExpressionHelper('"fo|o')).toBe(null);
    expect(getExpressionHelper('"foo|')).toBe(null);
    expect(getExpressionHelper('"foo| ')).toBe(null);

    expect(getExpressionHelper('"foo |bar')).toBe(null);
    expect(getExpressionHelper('"foo b|ar')).toBe(null);
    expect(getExpressionHelper('"foo ba|r')).toBe(null);
    expect(getExpressionHelper('"foo bar|')).toBe(null);
    expect(getExpressionHelper('"foo bar| ')).toBe(null);

    expect(getExpressionHelper("'|foo")).toBe(null);
    expect(getExpressionHelper("'f|oo")).toBe(null);
    expect(getExpressionHelper("'fo|o")).toBe(null);
    expect(getExpressionHelper("'foo|")).toBe(null);
    expect(getExpressionHelper("'foo| ")).toBe(null);

    expect(getExpressionHelper("'foo |bar")).toBe(null);
    expect(getExpressionHelper("'foo b|ar")).toBe(null);
    expect(getExpressionHelper("'foo ba|r")).toBe(null);
    expect(getExpressionHelper("'foo bar|")).toBe(null);
    expect(getExpressionHelper("'foo bar| ")).toBe(null);
  });

  it("should return expressions that are inside of a template string variable", () => {
    expect(getExpressionHelper("`foo ${|bar")).toBe("bar");
    expect(getExpressionHelper("`foo ${b|ar")).toBe("bar");
    expect(getExpressionHelper("`foo ${ba|r")).toBe("bar");
    expect(getExpressionHelper("`foo ${bar|")).toBe("bar");
    expect(getExpressionHelper("`foo ${bar|")).toBe("bar");

    expect(getExpressionHelper("`foo ${bar.|baz")).toBe("bar.baz");
    expect(getExpressionHelper("`foo ${bar.b|az")).toBe("bar.baz");
    expect(getExpressionHelper("`foo ${bar.ba|z")).toBe("bar.baz");
    expect(getExpressionHelper("`foo ${bar.baz|")).toBe("bar.baz");
  });
});
