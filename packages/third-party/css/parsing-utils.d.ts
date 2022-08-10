export interface ParsedCSSDeclaration {
  name: string;
  value: string;
  priority: "" | "important";
  terminator: string;
  offsets: [start: number, end: number];
  colonOffsets: [start: number, end: number];
  commentOffsets?: [start: number, end: number];
}

export function parseNamedDeclarations(
  isCssPropertyKnown: (cssProperty: string) => boolean,
  inputString: string,
  parseComments?: boolean
): ParsedCSSDeclaration[];
