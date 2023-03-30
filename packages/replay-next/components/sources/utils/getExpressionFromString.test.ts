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
    expect(getExpressionHelper("foo bar.baz")).toBe("bar.baz");
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

  it("should not return expressions that are part of a comment", () => {
    expect(getExpressionHelper("|// Example")).toBe(null);
    expect(getExpressionHelper("/|/ Example")).toBe(null);
    expect(getExpressionHelper("//| Example")).toBe(null);
    expect(getExpressionHelper("//| Example")).toBe(null);
    expect(getExpressionHelper("// |Example")).toBe(null);
    expect(getExpressionHelper("// Example|")).toBe(null);
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
    expect(getExpressionHelper("`foo ${b|ar")).toBe("bar");
    expect(getExpressionHelper("`foo ${ba|r")).toBe("bar");
    expect(getExpressionHelper("`foo ${bar|")).toBe("bar");
    expect(getExpressionHelper("`foo ${bar|")).toBe("bar");

    expect(getExpressionHelper("`foo ${bar.b|az")).toBe("bar.baz");
    expect(getExpressionHelper("`foo ${bar.ba|z")).toBe("bar.baz");
    expect(getExpressionHelper("`foo ${bar.baz|")).toBe("bar.baz");
  });

  it("should return expressions that are in the middle of a larger string", () => {
    expect(getExpressionHelper("foo, b|ar, baz")).toBe("bar");
    expect(getExpressionHelper("foo, ba|r, baz")).toBe("bar");
    expect(getExpressionHelper("foo, bar|, baz")).toBe("bar");

    expect(getExpressionHelper("foo, bar.p|rop, baz")).toBe("bar.prop");
    expect(getExpressionHelper("foo, bar.pr|op, baz")).toBe("bar.prop");
    expect(getExpressionHelper("foo, bar.pro|p, baz")).toBe("bar.prop");
    expect(getExpressionHelper("foo, bar.prop|, baz")).toBe("bar.prop");
  });

  it("should return expressions that are in the middle of a template string", () => {
    expect(getExpressionHelper('`URL: "${w|in}"')).toBe("win");
    expect(getExpressionHelper('`URL: "${wi|n}"')).toBe("win");
    expect(getExpressionHelper('`URL: "${win|}"')).toBe("win");

    expect(getExpressionHelper('`URL: "${window.l|oc}"')).toBe("window.loc");
    expect(getExpressionHelper('`URL: "${window.lo|c}"')).toBe("window.loc");
    expect(getExpressionHelper('`URL: "${window.loc|}"')).toBe("window.loc");
  });

  it("should not consider property tokens to the right of the cursor as part of an expression", () => {
    expect(getExpressionHelper('`URL: "${w|indow.loc}"')).toBe("window");
    expect(getExpressionHelper('`URL: "${wi|ndow.loc}"')).toBe("window");
    expect(getExpressionHelper('`URL: "${win|dow.loc}"')).toBe("window");
    expect(getExpressionHelper('`URL: "${wind|ow.loc}"')).toBe("window");
    expect(getExpressionHelper('`URL: "${windo|w.loc}"')).toBe("window");
    expect(getExpressionHelper('`URL: "${window|.loc}"')).toBe("window");
  });

  // FE-1102
  it("should not include function call when evaluating a parameter", () => {
    expect(getExpressionHelper("test(f|oo)")).toBe("foo");
    expect(getExpressionHelper("test(fo|o)")).toBe("foo");
    expect(getExpressionHelper("test(foo|)")).toBe("foo");

    expect(getExpressionHelper("test(f|oo, bar)")).toBe("foo");
    expect(getExpressionHelper("test(fo|o, bar)")).toBe("foo");
    expect(getExpressionHelper("test(foo|, bar)")).toBe("foo");

    expect(getExpressionHelper("test(foo, b|ar)")).toBe("bar");
    expect(getExpressionHelper("test(foo, ba|r)")).toBe("bar");
    expect(getExpressionHelper("test(foo, bar|)")).toBe("bar");
  });

  // FE-1136
  it("should properly handle bracket notation", () => {
    expect(getExpressionHelper("const foo = b|ar[baz];")).toBe("bar");
    expect(getExpressionHelper("const foo = ba|r[baz];")).toBe("bar");
    expect(getExpressionHelper("const foo = bar|[baz];")).toBe("bar");

    expect(getExpressionHelper("const foo = bar[b|az];")).toBe("bar[baz]");
    expect(getExpressionHelper("const foo = bar[ba|z];")).toBe("bar[baz]");
    expect(getExpressionHelper("const foo = bar[baz|];")).toBe("bar[baz]");
  });

  // FE-1368
  it("should properly handle negation operator", () => {
    expect(getExpressionHelper("if (!f|oo) {")).toBe("foo");
    expect(getExpressionHelper("if (!fo|o) {")).toBe("foo");
    expect(getExpressionHelper("if (!foo|) {")).toBe("foo");
  });

  describe("minified/mangled code", () => {
    it("keywords", () => {
      expect(getExpressionHelper('!fu|nction(){"use strict";var e={4:function(e,t,n)')).toBe(
        "function"
      );

      expect(getExpressionHelper('!function(){"use strict";v|ar e={4:function(e,t,n)')).toBe(null);
    });

    it("strings", () => {
      expect(getExpressionHelper('!function(){"|use strict";var e={4:function(e,t')).toBe(null);
      expect(getExpressionHelper('!function(){"use| strict";var e={4:function(e,t')).toBe(null);
      expect(getExpressionHelper('!function(){"use |strict";var e={4:function(e,t')).toBe(null);
      expect(getExpressionHelper('!function(){"use strict|";var e={4:function(e,t')).toBe(null);
    });

    it("numbers", () => {
      expect(getExpressionHelper('!function(){"use strict";var e={|4:function(e,t,n)')).toBe(null);
      expect(getExpressionHelper('!function(){"use strict";var e={4|:function(e,t')).toBe(null);
    });

    it("variables", () => {
      expect(getExpressionHelper('!function(){"use strict";var e={4:function(e|,t,n)')).toBe("e");
      expect(getExpressionHelper('!function(){"use strict";var e={4:function(e,t|')).toBe("t");
    });
  });
});
