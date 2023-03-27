import { assert } from "protocol/utils";

import { Entry } from "./types";
import { findMatch, isIterator } from "./utils";

type WithLogEntryParam<T> = {
  [P in keyof T]: T[P] extends (...args: any) => any
    ? (logEntry: Entry, ...args: Parameters<T[P]>) => ReturnType<T[P]>
    : T[P];
};

type Options<T> = {
  overrides?: Partial<WithLogEntryParam<T>>;
};

export default function createPlayer<T>(entries: Entry[], options?: Options<T>): T {
  const { overrides } = options || {};

  const proxy = new Proxy(
    {},
    {
      get(target: any, prop: string) {
        const logEntry = findMatch(entries, prop, null);
        if (logEntry?.isGetter) {
          const { isAsync, result } = logEntry;
          return isAsync ? Promise.resolve(result) : result;
        }

        if (overrides && prop in overrides) {
          return (...args: any[]) => {
            const logEntry = findMatch(entries, prop, args);
            if (logEntry != null) {
              return (overrides as any)[prop](logEntry, ...args);
            } else {
              console.error(
                `Could not find matching prop for "${prop}" with args ${JSON.stringify(args)}`
              );

              throw Error(`Could not find matching prop for "${prop}"`);
            }
          };
        }

        return (...args: any[]) => {
          const logEntry = findMatch(entries, prop, args);

          if (logEntry != null) {
            const { isAsync, paramCalls, result, error } = logEntry;

            if (paramCalls) {
              paramCalls.forEach(call => {
                const callback = args[call[0]];
                callback(...call[1]);
              });
            }

            if (error) {
              assert(error instanceof Error);
              if (isAsync) {
                return Promise.reject(error);
              }
              throw error;
            }

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
