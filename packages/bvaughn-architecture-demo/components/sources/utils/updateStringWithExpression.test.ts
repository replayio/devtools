import updateStringWithExpression from "./updateStringWithExpression";

// Converts a string like: "foo |bar"
// Into the string "foo bar" and the cursor index 4
function getExpressionHelper(text: string, expression: string): string | null {
  let cursorIndex = text.length;

  for (let index = 0; index < text.length; index++) {
    const character = text.charAt(index);
    if (character === "|") {
      cursorIndex = index;
      text = text.substring(0, index) + text.substring(index + 1);
      break;
    }
  }

  return updateStringWithExpression(text, cursorIndex, expression);
}

describe("updateStringWithExpression", () => {
  it("should replace the current token with the selected expression", () => {
    expect(getExpressionHelper("w|in", "window")).toBe("window");
    expect(getExpressionHelper("wi|n", "window")).toBe("window");
    expect(getExpressionHelper("win|", "window")).toBe("window");

    expect(getExpressionHelper("123, w|in", "window")).toBe("123, window");
    expect(getExpressionHelper("123, wi|n", "window")).toBe("123, window");
    expect(getExpressionHelper("123, win|", "window")).toBe("123, window");
  });

  it("should replace the an object attribute with the selected expression", () => {
    expect(getExpressionHelper("window.|loc", "location")).toBe("window.location");
    expect(getExpressionHelper("window.l|oc", "location")).toBe("window.location");
    expect(getExpressionHelper("window.lo|c", "location")).toBe("window.location");
    expect(getExpressionHelper("window.loc|", "location")).toBe("window.location");
  });

  it("should only replace the variable portion of a template string", () => {
    expect(getExpressionHelper("`URL: ${|win", "window")).toBe("`URL: ${window");
    expect(getExpressionHelper("`URL: ${w|in", "window")).toBe("`URL: ${window");
    expect(getExpressionHelper("`URL: ${wi|n", "window")).toBe("`URL: ${window");
    expect(getExpressionHelper("`URL: ${win|", "window")).toBe("`URL: ${window");

    expect(getExpressionHelper("`URL: ${window.|loc", "location")).toBe("`URL: ${window.location");
    expect(getExpressionHelper("`URL: ${window.l|oc", "location")).toBe("`URL: ${window.location");
    expect(getExpressionHelper("`URL: ${window.lo|c", "location")).toBe("`URL: ${window.location");
    expect(getExpressionHelper("`URL: ${window.loc|", "location")).toBe("`URL: ${window.location");
  });

  it("should support replacing tokens in the middle of a larger string", () => {
    expect(getExpressionHelper("foo, |bar, baz", "barber")).toBe("foo, barber, baz");
    expect(getExpressionHelper("foo, b|ar, baz", "barber")).toBe("foo, barber, baz");
    expect(getExpressionHelper("foo, ba|r, baz", "barber")).toBe("foo, barber, baz");
    expect(getExpressionHelper("foo, bar|, baz", "barber")).toBe("foo, barber, baz");

    expect(getExpressionHelper("foo bar.|pro three", "property")).toBe("foo bar.property three");
    expect(getExpressionHelper("foo bar.p|ro three", "property")).toBe("foo bar.property three");
    expect(getExpressionHelper("foo bar.pr|o three", "property")).toBe("foo bar.property three");
    expect(getExpressionHelper("foo bar.pro| three", "property")).toBe("foo bar.property three");
  });
});
