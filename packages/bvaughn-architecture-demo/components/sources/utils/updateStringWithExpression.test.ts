import updateStringWithExpression from "./updateStringWithExpression";

// Converts a string like: "foo |bar"
// Into the string "foo bar" and the cursor index 4
function updateExpressionHelper(text: string, expression: string): [string, number] {
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
    expect(updateExpressionHelper("w|in", "window")).toEqual(["window", 6]);
    expect(updateExpressionHelper("wi|n", "window")).toEqual(["window", 6]);
    expect(updateExpressionHelper("win|", "window")).toEqual(["window", 6]);

    expect(updateExpressionHelper("123, w|in", "window")).toEqual(["123, window", 11]);
    expect(updateExpressionHelper("123, wi|n", "window")).toEqual(["123, window", 11]);
    expect(updateExpressionHelper("123, win|", "window")).toEqual(["123, window", 11]);
  });

  it("should replace the an object attribute with the selected expression", () => {
    expect(updateExpressionHelper("window.|loc", "location")).toEqual(["window.location", 15]);
    expect(updateExpressionHelper("window.l|oc", "location")).toEqual(["window.location", 15]);
    expect(updateExpressionHelper("window.lo|c", "location")).toEqual(["window.location", 15]);
    expect(updateExpressionHelper("window.loc|", "location")).toEqual(["window.location", 15]);
  });

  it("should only replace the variable portion of a template string", () => {
    expect(updateExpressionHelper("`URL: ${|win", "window")).toEqual(["`URL: ${window", 14]);
    expect(updateExpressionHelper("`URL: ${w|in", "window")).toEqual(["`URL: ${window", 14]);
    expect(updateExpressionHelper("`URL: ${wi|n", "window")).toEqual(["`URL: ${window", 14]);
    expect(updateExpressionHelper("`URL: ${win|", "window")).toEqual(["`URL: ${window", 14]);

    expect(updateExpressionHelper("`URL: ${window.|loc", "location")).toEqual([
      "`URL: ${window.location",
      23,
    ]);
    expect(updateExpressionHelper("`URL: ${window.l|oc", "location")).toEqual([
      "`URL: ${window.location",
      23,
    ]);
    expect(updateExpressionHelper("`URL: ${window.lo|c", "location")).toEqual([
      "`URL: ${window.location",
      23,
    ]);
    expect(updateExpressionHelper("`URL: ${window.loc|", "location")).toEqual([
      "`URL: ${window.location",
      23,
    ]);

    expect(updateExpressionHelper('`URL: "${window.|loc}"`', "location")).toEqual([
      '`URL: "${window.location}"`',
      24,
    ]);
    expect(updateExpressionHelper('`URL: "${window.l|oc}"`', "location")).toEqual([
      '`URL: "${window.location}"`',
      24,
    ]);
    expect(updateExpressionHelper('`URL: "${window.lo|c}"`', "location")).toEqual([
      '`URL: "${window.location}"`',
      24,
    ]);
    expect(updateExpressionHelper('`URL: "${window.loc|}"`', "location")).toEqual([
      '`URL: "${window.location}"`',
      24,
    ]);
  });

  it("should support replacing tokens in the middle of a larger string", () => {
    expect(updateExpressionHelper("foo, |bar, baz", "barber")).toEqual(["foo, barber, baz", 11]);
    expect(updateExpressionHelper("foo, b|ar, baz", "barber")).toEqual(["foo, barber, baz", 11]);
    expect(updateExpressionHelper("foo, ba|r, baz", "barber")).toEqual(["foo, barber, baz", 11]);
    expect(updateExpressionHelper("foo, bar|, baz", "barber")).toEqual(["foo, barber, baz", 11]);

    expect(updateExpressionHelper("foo bar.|pro three", "property")).toEqual([
      "foo bar.property three",
      16,
    ]);
    expect(updateExpressionHelper("foo bar.p|ro three", "property")).toEqual([
      "foo bar.property three",
      16,
    ]);
    expect(updateExpressionHelper("foo bar.pr|o three", "property")).toEqual([
      "foo bar.property three",
      16,
    ]);
    expect(updateExpressionHelper("foo bar.pro| three", "property")).toEqual([
      "foo bar.property three",
      16,
    ]);
  });
});
