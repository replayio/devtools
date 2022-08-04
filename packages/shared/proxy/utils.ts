import { Entry } from "./types";

export function findMatch(entries: Entry[], methodName: string, args: any[] | null): Entry | null {
  return (
    entries.find(entry => {
      if (entry.method !== methodName) {
        return false;
      } else if ((args === null) !== (entry.args === null) || entry.args?.length !== args?.length) {
        return false;
      } else if (args !== null && entry.args !== null) {
        for (let index = 0; index < args.length; index++) {
          // We use JSON.stringify to compare values rather than a method like lodash/isEqual
          // because params with undefined values will be stripped during JSON.stringify/JSON.parse.
          // This is the most straightforward way to account for that difference.
          if (JSON.stringify(args[index]) !== JSON.stringify(entry.args[index])) {
            return false;
          }
        }
      }

      return true;
    }) || null
  );
}

export function isIterator(value: any): boolean {
  return typeof value === "symbol" && (value as Symbol).toString().includes("Symbol.iterator");
}

export function isThennable(value: any): boolean {
  return value != null && typeof value.then === "function";
}
