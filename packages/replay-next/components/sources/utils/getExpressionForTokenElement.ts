import { getTokenTypeFromClassName } from "replay-next/components/sources/utils/tokens";

export default function getExpressionForTokenElement(
  rowElement: HTMLElement,
  tokenElement: HTMLElement
): string | null {
  if (!tokenElement.hasAttribute("data-inspectable-token")) {
    return null;
  }

  if (tokenElement.tagName === "PRE") {
    return null;
  }

  switch (tokenElement.className) {
    case "tok-comment":
    case "tok-number":
    case "tok-operator":
    case "tok-punctuation":
    case "tok-string":
    case "tok-string2":
      return null;
  }

  const children = Array.from(rowElement.childNodes);

  let expression = tokenElement.textContent!;
  let index = children.indexOf(tokenElement) - 1;
  outer: while (index >= 0) {
    const currentTokenElement = children[index] as HTMLElement;
    const tokenType = getTokenTypeFromClassName(currentTokenElement.className);
    const code = currentTokenElement.textContent;

    if (currentTokenElement.nodeName === "#text") {
      break;
    } else {
      const textContent = code;
      if (textContent === null || textContent.trim() === "") {
        break;
      }
    }

    switch (tokenType) {
      case "operator":
      case "punctuation":
        if (code !== ".") {
          break outer;
        }
      case "propertyName":
      case "variableName":
      case "variableName2":
        break;
      default:
        break outer;
    }

    expression = code + expression;

    index--;
  }

  return expression;
}
