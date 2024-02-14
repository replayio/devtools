import { assert } from "protocol/utils";
import { getClassNames, isTokenInspectable } from "replay-next/components/sources/utils/tokens";
import { parse } from "replay-next/src/suspense/SyntaxParsingCache";

import getExpressionForTokenElement from "./getExpressionForTokenElement";

// Syntax parses a string like: "foo b|ar" and evaluates the token "bar"
function getExpressionHelper(expression: string): string | null {
  const cursorIndex = expression.indexOf("|");
  const code = expression.replace("|", "");

  const tokens = parse(code, ".js")[0];

  let targetElement: HTMLElement | null = null;

  const containerElement = document.createElement("div");
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];

    const inspectable = isTokenInspectable(token);
    const classNames = getClassNames(token);

    const tokenHtmlElement = document.createElement("span");
    tokenHtmlElement.className = classNames.join(" ");
    tokenHtmlElement.textContent = token.value;
    tokenHtmlElement.setAttribute("data-column-index", token.columnIndex.toString());
    if (inspectable) {
      tokenHtmlElement.setAttribute("data-inspectable-token", "true");
    }

    if (
      targetElement === null &&
      cursorIndex >= token.columnIndex &&
      cursorIndex <= token.columnIndex + token.value.length
    ) {
      targetElement = tokenHtmlElement;
    }

    containerElement.appendChild(tokenHtmlElement);
  }

  assert(targetElement);

  return getExpressionForTokenElement(containerElement, targetElement);
}

describe("getExpressionForTokenElement", () => {
  it("should parse simple non-inspectable values", () => {
    expect(getExpressionHelper('"f|oo"')).toBe(null);
    expect(getExpressionHelper("1|23")).toBe(null);
    expect(getExpressionHelper("tr|ue")).toBe(null);
    expect(getExpressionHelper("fals|e")).toBe(null);
  });

  it("should parse simple expressions", () => {
    expect(getExpressionHelper('l|et foo = "bar";')).toBe(null);
    expect(getExpressionHelper('let f|oo = "bar";')).toBe("foo");
    expect(getExpressionHelper('let foo = "b|ar";')).toBe(null);
  });

  it("should parse inline array declaration", () => {
    expect(getExpressionHelper("c|onst foo = [bar, baz]")).toBe(null);
    expect(getExpressionHelper("const f|oo = [bar, baz]")).toBe("foo");
    expect(getExpressionHelper("const foo = [b|ar, baz]")).toBe("bar");
    expect(getExpressionHelper("const foo = [bar, b|az]")).toBe("baz");
  });

  it("should parse destructuring syntax", () => {
    expect(getExpressionHelper("c|onst {foo, bar = 123} = baz;")).toBe(null);
    expect(getExpressionHelper("const {f|oo, bar = 123} = baz;")).toBe("foo");
    expect(getExpressionHelper("const {foo, b|ar = 123} = baz;")).toBe("bar");
    expect(getExpressionHelper("const {foo, bar = 12|3} = baz;")).toBe(null);
    expect(getExpressionHelper("const {foo, bar = 123} = b|az;")).toBe("baz");
  });

  // FE-1102
  it("should parse function parameters", () => {
    expect(getExpressionHelper("f|unction foo(bar, baz = 123) {}")).toBe(null);
    expect(getExpressionHelper("function fo|o(bar, baz = 123) {}")).toBe("foo");
    expect(getExpressionHelper("function foo(b|ar, baz = 123) {}")).toBe("bar");
    expect(getExpressionHelper("function foo(bar, b|az = 123) {}")).toBe("baz");
    expect(getExpressionHelper("function foo(bar, baz = 12|3) {}")).toBe(null);
  });

  it("should parse expressions containing dot notation", () => {
    expect(getExpressionHelper("co|nst foo = bar.baz;")).toBe(null);
    expect(getExpressionHelper("const f|oo = bar.baz;")).toBe("foo");
    expect(getExpressionHelper("const foo = b|ar.baz;")).toBe("bar");
    expect(getExpressionHelper("const foo = bar.b|az;")).toBe("bar.baz");
    expect(getExpressionHelper("const foo = bar.baz.q|ux;")).toBe("bar.baz.qux");
  });

  // FE-1136
  it("should parse expressions containing bracket notation", () => {
    expect(getExpressionHelper("v|ar foo = bar[0];")).toBe(null);
    expect(getExpressionHelper("var f|oo = bar[0];")).toBe("foo");
    expect(getExpressionHelper("var foo = ba|r[0];")).toBe("bar");
    expect(getExpressionHelper("var foo = bar[|0];")).toBe(null);
  });

  it("should parse expressions within template strings", () => {
    expect(getExpressionHelper("`f|oo ${bar.baz.qux}`")).toBe(null);
    expect(getExpressionHelper("`foo ${b|ar.baz.qux}`")).toBe("bar");
    expect(getExpressionHelper("`foo ${bar.b|az.qux}`")).toBe("bar.baz");
    expect(getExpressionHelper("`foo ${bar.baz.q|ux}`")).toBe("bar.baz.qux");
  });

  // FE-1368
  it("should properly handle negation operator", () => {
    expect(getExpressionHelper("i|f (!foo) {}")).toBe(null);
    expect(getExpressionHelper("if (!fo|o) {}")).toBe("foo");
  });

  it("should parse function calls", () => {
    expect(getExpressionHelper("const foo = b|ar() || 0")).toBe("bar");
    expect(getExpressionHelper("const foo = b|ar(baz) || 0")).toBe("bar");
    expect(getExpressionHelper("const foo = bar(b|az) || 0")).toBe("baz");
  });

  // FE-1735
  it("should support instance properties", () => {
    expect(getExpressionHelper("this.ar|ray")).toBe("this.array");
  });

  // FE-2253
  it("should support the optional chaining operator", () => {
    expect(getExpressionHelper("object?.p|roperty")).toBe("object?.property");
    expect(getExpressionHelper("object?.propert|y")).toBe("object?.property");
    expect(getExpressionHelper("object?.property|")).toBe("object?.property");
  });
});
