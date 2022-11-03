import { Entry, ParamCall } from "./types";
import { findMatch, isIterator, isThennable } from "./utils";

type Options<T> = {
  onAsyncRequestPending?: Function;
  onAsyncRequestResolved?: Function;
  onEntriesChanged?: (newEntry: Entry) => void;
  overrides?: Partial<T>;
  sanitizeArgs?: (prop: string, args: any[] | null) => any[] | null;
  sanitizeResult?: (prop: string, result: any) => any;
};

export type RecorderAPI = {
  callParamWithArgs: (paramIndex: number, ...args: any[]) => void;
  holdUntil: () => () => void;
};

// Note that the Proxy recorder has some limitations:
//   1. It does not support the event emitter pattern.
//   2. Limited support is available for methods without args (e.g. `getState()`).
//      Because there is no way to uniquely identify a method call without args, only the last value returned will be recorded.
export default function createRecorder<T>(target: T, options?: Options<T>): [T, Entry[]] {
  const {
    onAsyncRequestPending = () => {},
    onAsyncRequestResolved = () => {},
    onEntriesChanged = (_: Entry) => {},
    overrides = null,
    sanitizeArgs = (_: string, args: any[] | null) => args,
    sanitizeResult = (_: string, result: any) => result,
  } = options || {};

  const proto = Object.getPrototypeOf(target);
  const hasOwnProperty = (prop: string) => proto.hasOwnProperty(prop);
  const getOwnPropertyDescriptor = (prop: string) => Object.getOwnPropertyDescriptor(proto, prop);

  const entries: Entry[] = [];

  function recordEntry(
    prop: string,
    args: any[] | null,
    returnValue: any,
    paramCalls: ParamCall[] | null = null
  ) {
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

      if (paramCalls !== null && paramCalls.length > 0) {
        entry.paramCalls = paramCalls;
      }

      entries.push(entry);
    }

    // Unwrap Promise values
    if (isThennable(returnValue)) {
      entry.isAsync = true;
      entry.thennable = returnValue;

      onAsyncRequestPending();

      const thennable = returnValue;

      returnValue = thennable.then((resolved: any) => {
        if (thennable === entry.thennable) {
          // Only the latest request should update the shared entry.
          // For multiple matching calls, the player should always return the latest value.
          entry.result = resolved;
        }

        onAsyncRequestResolved();
        onEntriesChanged(entry);

        return resolved;
      });
    } else {
      entry.result = returnValue;

      onEntriesChanged(entry);
    }

    return returnValue;
  }

  const proxy = new Proxy(target as any, {
    get(target: any, prop: string) {
      const isGetter =
        hasOwnProperty(prop) && typeof getOwnPropertyDescriptor(prop)?.get === "function";
      if (isGetter) {
        let returnValue = target[prop];

        if (isThennable(returnValue)) {
          returnValue = returnValue.then(resolved => sanitizeResult(prop, resolved));
        } else {
          returnValue = sanitizeResult(prop, returnValue);
        }

        return recordEntry(prop, null, returnValue);
      } else {
        return (...args: any[]) => {
          if (isIterator(prop)) {
            return undefined;
          }

          const paramCalls: ParamCall[] = [];

          let didRecord = false;
          let shouldHold = false;

          const recorderAPI: RecorderAPI = {
            callParamWithArgs: (paramIndex: number, ...args: any[]) => {
              paramCalls.push([paramIndex, args]);
            },
            holdUntil: () => {
              shouldHold = true;
              return () => {
                shouldHold = false;
                recordEntryWhenReady();
              };
            },
          };

          let returnValue =
            overrides && overrides.hasOwnProperty(prop)
              ? (overrides as any)[prop](...args.concat(recorderAPI))
              : target[prop](...args);

          if (isThennable(returnValue)) {
            returnValue = returnValue.then(resolved => sanitizeResult(prop, resolved));
          } else {
            returnValue = sanitizeResult(prop, returnValue);
          }

          const recordEntryWhenReady = () => {
            if (!shouldHold && !didRecord) {
              didRecord = true;

              recordEntry(prop, args, returnValue, paramCalls);
            }
          };

          recordEntryWhenReady();

          return returnValue;
        };
      }
    },
  });

  return [proxy, entries];
}
