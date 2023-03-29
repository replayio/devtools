import { ParsedToken } from "replay-next/src/utils/syntax-parser";

import { formatExpressionToken } from "./formatExpressionToken";

function formatExpression(text: string): string {
  return formatExpressionToken({
    columnIndex: 0,
    types: ["string"],
    value: text,
  }).value;
}

describe("formatExpression", () => {
  it("should not modify text unnecessarily", () => {
    expect(formatExpression("")).toBe("");

    expect(formatExpression('"a"')).toBe('"a"');
    expect(formatExpression("'a'")).toBe("'a'");
    expect(formatExpression("`a`")).toBe("`a`");

    expect(formatExpression("'a`b'")).toBe("'a`b'");
    expect(formatExpression("`aa'b`")).toBe("`aa'b`");
    expect(formatExpression(`'a"bb'`)).toBe(`'a"bb'`);

    expect(formatExpression(`'aa"b\`c'`)).toBe(`'aa"b\`c'`);
    expect(formatExpression("`a\"bb'c`")).toBe("`a\"bb'c`");
    expect(formatExpression("'a\"b`cc'")).toBe("'a\"b`cc'");
  });

  it("should reduce strings with unnecessarily escaped quotes", () => {
    expect(formatExpression("'a\\'b'")).toBe(`"a'b"`);
    expect(formatExpression('"aa\\"b"')).toBe(`'aa"b'`);
    expect(formatExpression("`a\\`bb`")).toBe("'a`bb'");

    expect(formatExpression(`'aa"b\\'c'`)).toBe("`aa\"b'c`");
    expect(formatExpression(`"a'bb\\"c"`)).toBe("`a'bb\"c`");
    expect(formatExpression('`a"b\\`cc`')).toBe("'a\"b`cc'");
  });

  it("should not modify potential template literals that contain string interpolation", () => {
    expect(formatExpression("`aa ${cc} dd`")).toBe("`aa ${cc} dd`");
    expect(formatExpression("`aa`bb ${cc} dd`")).toBe("`aa`bb ${cc} dd`");

    // These strings are okay too modify though because they aren't using backticks
    expect(formatExpression("'a\\'b ${c} d'")).toBe(`"a'b \${c} d"`);
    expect(formatExpression('"aa\\"bb ${cc} dd"')).toBe(`'aa"bb \${cc} dd'`);
  });

  it("should not modify strings that cannot be reduced", () => {
    expect(formatExpression("'a\\\"b\\'c\\`d'")).toBe("'a\\\"b\\'c\\`d'");
  });

  it("should not modify non string values", () => {
    expect(formatExpression("123")).toBe("123");
    expect(formatExpression("abc")).toBe("abc");
    expect(formatExpression("true")).toBe("true");
  });

  it("should not modify non-string token types", () => {
    const token: ParsedToken = {
      columnIndex: 0,
      types: ["number"],
      value: "123",
    };

    expect(formatExpressionToken(token)).toBe(token);
  });
});
