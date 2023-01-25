import getExpressionRange from "./getExpressionRange";

export default function updateStringWithExpression(
  string: string,
  cursorIndex: number,
  expression: string
): [newString: string, newCursorIndex: number] {
  const [startIndex, endIndex] = getExpressionRange(string, cursorIndex);

  const head = string.substring(0, startIndex);
  const tail = string.substring(endIndex);
  const newString = head + expression + tail;
  const newCursorIndex = head.length + expression.length;

  return [newString, newCursorIndex];
}
