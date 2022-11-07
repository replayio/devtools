export default function updateStringWithExpression(
  string: string,
  cursorIndex: number,
  expression: string
): [newString: string, newCursorIndex: number] {
  let startIndex = cursorIndex;
  while (startIndex >= 0) {
    const prevCharacter = string.charAt(startIndex - 1);
    if (prevCharacter === "." || prevCharacter === " " || prevCharacter === "{") {
      break;
    }
    startIndex--;
  }

  let endIndex = cursorIndex;
  while (endIndex < string.length) {
    const character = string.charAt(endIndex);
    if (character === "." || character === " " || character === "}" || character === ",") {
      break;
    }
    endIndex++;
  }

  const head = string.substring(0, startIndex);
  const tail = string.substring(endIndex);
  const newString = head + expression + tail;
  const newCursorIndex = head.length + expression.length;

  return [newString, newCursorIndex];
}
