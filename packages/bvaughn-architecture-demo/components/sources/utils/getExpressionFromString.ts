import { highlighter } from "bvaughn-architecture-demo/src/suspense/SyntaxParsingCache";

export default function getExpressionFromString(
  expression: string,
  cursorIndex: number
): string | null {
  const parsed = highlighter(expression, ".js");
  if (parsed == null || parsed.length === 0) {
    return null;
  } else {
    const line = parsed[parsed.length - 1];

    const element = document.createElement("div");
    element.innerHTML = line;

    let childIndex = 0;
    let textIndex = 0;
    while (childIndex < element.children.length) {
      const child = element.children[childIndex];
      if (child.textContent !== null) {
        textIndex += child.textContent.length;
      }

      if (textIndex >= cursorIndex) {
        break;
      } else {
        childIndex++;
      }
    }

    const child = element.children[Math.min(childIndex, element.children.length - 1)];
    switch (child.className) {
      case "tok-bool":
        // Don't try to auto-complete booleans.
        return null;
      case "tok-number":
        // Don't try to auto-complete numbers.
        return null;
      case "tok-string":
      case "tok-string2":
        // Don't try to auto-complete strings.
        return null;
    }
  }

  let token = "";
  let currentIndex = cursorIndex - 1;
  while (currentIndex >= 0) {
    const character = expression.charAt(currentIndex);
    if (character === " " || character === "{") {
      break;
    }

    token = character + token;
    currentIndex--;
  }

  currentIndex = cursorIndex;
  while (currentIndex < expression.length) {
    const character = expression.charAt(currentIndex);
    if (character === " " || character === "}" || character === ",") {
      break;
    }

    token += character;
    currentIndex++;
  }

  return token || null;
}
