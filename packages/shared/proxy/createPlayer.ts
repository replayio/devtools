import { Entry } from "./types";
import { findMatch, isIterator } from "./utils";

export default function createPlayer<T>(entries: Entry[]): T {
  const proxy = new Proxy(
    {},
    {
      get(_: any, prop: string) {
        const logEntry = findMatch(entries, prop, null);
        if (logEntry?.isGetter) {
          const { isAsync, result } = logEntry;
          return isAsync ? Promise.resolve(result) : result;
        }

        return (...args: any[]) => {
          const logEntry = findMatch(entries, prop, args);
          if (logEntry != null) {
            const { isAsync, result } = logEntry;
            return isAsync ? Promise.resolve(result) : result;
          } else {
            if (isIterator(prop)) {
              return undefined;
            }

            console.error(
              `Could not find matching prop for "${prop}" with args ${JSON.stringify(args)}`
            );

            throw Error(`Could not find matching prop for "${prop}"`);
          }
        };
      },
    }
  );

  return proxy;
}
