import { ParsedToken } from "replay-next/src/utils/syntax-parser";

export function getClassNames(token: ParsedToken): string[] {
  return token.types?.map(type => `tok-${type}`) ?? [];
}

export function getTokenTypeFromClassName(className: string): string | null {
  const classNames = className.split(" ");
  return classNames.find(className => className.startsWith("tok-"))?.slice(4) ?? null;
}

export function isTokenInspectable(token: ParsedToken): boolean {
  return (
    token.types != null &&
    token.types.some(type => {
      switch (type) {
        case "definition":
        case "local":
        case "propertyName":
        case "typeName":
        case "variableName":
        case "variableName2":
          return true;
        case "keyword":
          return token.value === "this";
      }
      return false;
    })
  );
}
