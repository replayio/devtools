import { parse, parsedTokensToHtml } from "replay-next/src/suspense/SyntaxParsingCache";

export default function getExpressionFromString(
  string: string,
  cursorIndex: number
): string | null {
  let parsedTokensByLine = parse(string, ".js");
  if (parsedTokensByLine == null || parsedTokensByLine.length === 0) {
    return null;
  }

  const parsedTokens = parsedTokensByLine[parsedTokensByLine.length - 1];

  const element = document.createElement("div");
  element.innerHTML = parsedTokensToHtml(parsedTokens);

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
    case "tok-number":
    case "tok-operator":
    case "tok-punctuation":
    case "tok-string":
    case "tok-string2":
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
      case "(":
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
      case ")":
      case ",":
      case ".":
        break nextLoop;
    }

    expression += character;
    currentIndex++;
  }

  parsedTokensByLine = parse(expression, ".js");
  if (parsedTokensByLine == null || parsedTokensByLine.length === 0) {
    return null;
  } else {
    element.innerHTML = parsedTokensToHtml(parsedTokensByLine[0]);
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
