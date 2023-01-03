export default function getExpressionRange(
  string: string,
  cursorIndex: number
): [startIndex: number, endIndex: number] {
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

  return [startIndex, endIndex];
}
