export default function updateStringWithExpression(
  string: string,
  cursorIndex: number,
  expression: string
): string {
  let index = cursorIndex;
  while (index >= 0) {
    const character = string.charAt(index - 1);
    if (character === "." || character === " " || character === "{") {
      break;
    }
    index--;
  }

  return string.substring(0, index) + expression;
}
