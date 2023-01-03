export default function getExpressionForTokenElement(
  rowElement: HTMLElement,
  tokenElement: HTMLElement
): string | null {
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
  let currentTokenElement = tokenElement;
  while (currentTokenElement != null) {
    const index = children.indexOf(currentTokenElement);
    if (index < 1) {
      break;
    }

    currentTokenElement = children[index - 1] as HTMLElement;
    if (currentTokenElement.nodeName === "#text") {
      break;
    } else {
      const textContent = currentTokenElement.textContent;
      if (textContent === null || textContent.trim() === "") {
        break;
      }
    }

    if (currentTokenElement.className !== "tok-punctuation") {
      expression = currentTokenElement.textContent + expression;
    }

    if (currentTokenElement.textContent !== ".") {
      break;
    }
  }

  return expression.startsWith(".") ? expression.slice(1) : expression;
}
