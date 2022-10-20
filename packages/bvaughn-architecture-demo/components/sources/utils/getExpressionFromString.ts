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

  // Don't try to auto-complete numbers.
  if (`${parseFloat(expression)}` === expression) {
    return null;
  }

  // Don't try to auto-complete booleans.
  if (expression === "true" || expression === "false") {
    return null;
  }

  return expression || null;
}
