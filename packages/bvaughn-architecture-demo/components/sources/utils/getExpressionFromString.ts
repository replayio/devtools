import { highlighter } from "bvaughn-architecture-demo/src/suspense/SyntaxParsingCache";

export default function getExpressionFromString(
  string: string,
  cursorIndex: number
): string | null {
  const parsedString = highlighter(string, ".js");
  if (parsedString == null || parsedString.length === 0) {
    return null;
  }

  const line = parsedString[parsedString.length - 1];

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
    case "tok-comment":
    case "tok-string":
    case "tok-string2":
      // Don't try to auto-complete strings.
      return null;
  }

  let expression = "";
  let currentIndex = cursorIndex - 1;
  previousLoop: while (currentIndex >= 0) {
    const character = string.charAt(currentIndex);
    switch (character) {
      case " ":
      case ":":
      case ";":
      case "+":
      case "{":
      case ")":
      case "!":
      case ",":
        break previousLoop;
    }

    expression = character + expression;
    currentIndex--;
  }

  currentIndex = cursorIndex;

  nextLoop: while (currentIndex < string.length) {
    const character = string.charAt(currentIndex);
    switch (character) {
      case " ":
      case ":":
      case ";":
      case "+":
      case "}":
      case "(":
      case ",":
      case ".":
        break nextLoop;
    }

    expression += character;
    currentIndex++;
  }

  const parsedExpression = highlighter(expression, ".js");
  if (parsedExpression == null || parsedExpression.length === 0) {
    return null;
  } else {
    element.innerHTML = parsedExpression[0];
    if (element.children.length === 1) {
      const child = element.children[0];
      switch (child.className) {
        case "tok-bool":
        case "tok-number":
        case "tok-punctuation": {
          // Don't try to auto-complete booleans, numbers, or punctuation marks.
          return null;
        }
        case "tok-keyword": {
          switch (expression) {
            case "const":
            case "let":
            case "var":
              return null;
          }
          break;
        }
      }
    }
  }

  return expression || null;
}
