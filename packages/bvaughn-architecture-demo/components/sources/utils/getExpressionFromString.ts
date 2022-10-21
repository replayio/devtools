export default function getExpressionFromString(
  string: string,
  characterIndex: number
): string | null {
  let expression = "";
  let currentIndex = characterIndex;
  while (currentIndex >= 0) {
    const character = string.charAt(currentIndex);
    if (character === " ") {
      break;
    }

    expression = character + expression;
    currentIndex--;
  }

  // Do some basic validation to make sure the expression is valid

  // Don't try to auto-complete numbers.
  if (`${parseFloat(expression)}` === expression) {
    return null;
  }

  // Don't try to auto-complete booleans.
  if (expression === "true" || expression === "false") {
    return null;
  }

  // Don't try to auto-complete strings.
  switch (expression.charAt(0)) {
    case '"':
    case "'":
      return null;
  }

  return expression || null;
}
