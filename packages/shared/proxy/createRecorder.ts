import { Entry } from "./types";
import { findMatch, isIterator, isThennable } from "./utils";

type Options = {
  onAsyncRequestPending?: Function;
  onAsyncRequestResolved?: Function;
  onEntriesChanged?: Function;
  sanitizeArgs?: (prop: string, args: any[] | null) => any[] | null;
  sanitizeResult?: (prop: string, result: any) => any;
};

// Note that the Proxy recorder has some limitations:
//   1. It does not support the event emitter pattern.
//   2. Limited support is available for methods without args (e.g. `getState()`).
//      Because there is no way to uniquely identify a method call without args, only the last value returned will be recorded.
export default function createRecorder<T>(target: T, options?: Options): [T, Entry[]] {
  const {
    onAsyncRequestPending = () => {},
    onAsyncRequestResolved = () => {},
    onEntriesChanged = () => {},
    sanitizeArgs = (_: string, args: any[] | null) => args,
    sanitizeResult = (_: string, result: any) => result,
  } = options || {};

  const proto = Object.getPrototypeOf(target);
  const hasOwnProperty = (prop: string) => proto.hasOwnProperty(prop);
  const getOwnPropertyDescriptor = (prop: string) => Object.getOwnPropertyDescriptor(proto, prop);

  const entries: Entry[] = [];

  function recordEntry(prop: string, args: any[] | null, returnValue: any) {
    // If this prop has already been called with these params, store the latest value.
    const prevEntry = findMatch(entries, prop, args);
    let entry: Entry;
    if (prevEntry) {
      entry = prevEntry;
    } else {
      entry = {
        args: sanitizeArgs(prop, args),
        isAsync: false,
        isGetter: args === null,
        prop,

        // This gets filled in below
        result: null,
        thennable: null,
      };

      entries.push(entry);
    }

    // Unwrap Promise values
    if (isThennable(returnValue)) {
      entry.isAsync = true;
      entry.thennable = returnValue;

      onAsyncRequestPending();

      const thennable = returnValue;

      returnValue = thennable.then((resolved: any) => {
        returnValue = sanitizeResult(prop, resolved);

        if (thennable === entry.thennable) {
          // Only the latest request should update the shared entry.
          // For multiple matching calls, the player should always return the latest value.
          entry.result = returnValue;
        }

        onAsyncRequestResolved();
        onEntriesChanged();

        return returnValue;
      });
    } else {
      entry.result = returnValue = sanitizeResult(prop, returnValue);

      onEntriesChanged();
    }

    return returnValue;
  }

  const proxy = new Proxy(target as any, {
    get(target: any, prop: string) {
      const isGetter =
        hasOwnProperty(prop) && typeof getOwnPropertyDescriptor(prop)?.get === "function";
      if (isGetter) {
        return recordEntry(prop, null, target[prop]);
      } else {
        return (...args: any[]) => {
          if (isIterator(prop)) {
            return undefined;
          }

          return recordEntry(prop, args, target[prop](...args));
        };
      }
    },
  });

  return [proxy, entries];
}
