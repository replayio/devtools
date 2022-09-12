type ErrorHandler = (error: Error) => void;

let errorHandler: ErrorHandler = (error: Error) => {
  throw error;
};

// By default, this package throw Errors.
// You can override that behavior with this method (e.g. to log errors to Sentry).
export function setErrorHandler(customErrorHandler: ErrorHandler) {
  errorHandler = customErrorHandler;
}

export function makeInfallible(fn: (...args: any[]) => void, thisv?: any) {
  return (...args: any[]) => {
    try {
      fn.apply(thisv, args);
    } catch (e) {
      console.error(e);
    }
  };
}

export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: any) => void;
}

export function defer<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export const waitForTime = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export function throttle(callback: () => void, time: number) {
  let scheduled = false;
  return () => {
    if (scheduled) {
      return;
    }
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      callback();
    }, time);
  };
}

export function clamp(value: number, min: number, max: number) {
  assert(min < max, "min should be less than max");
  return Math.max(min, Math.min(max, value));
}

export function assert(condition: any, message = "Assertion failed!"): asserts condition {
  if (!condition) {
    console.error(message);
    errorHandler(new Error(message));
  }
}

export function binarySearch(start: number, end: number, callback: (mid: number) => number) {
  while (start + 1 < end) {
    const mid = ((start + end) / 2) | 0;
    const rv = callback(mid);
    if (rv < 0) {
      end = mid;
    } else {
      start = mid;
    }
  }
  return start;
}

interface Timed {
  time: number;
}

// Given a sorted array of items with "time" properties, find the index of
// the most recent item at or preceding a given time.
export function mostRecentIndex<T extends Timed>(array: T[], time: number): number | undefined {
  if (!array.length || time < array[0].time) {
    return undefined;
  }
  const index = binarySearch(0, array.length, (index: number) => {
    return time - array[index].time;
  });
  assert(
    array[index].time <= time,
    "The most recent item should be at or preceding the given time"
  );
  if (index + 1 < array.length) {
    assert(array[index + 1].time >= time, "the most recent item's index should be in the array");
  }
  return index;
}

const lastTime = (list: Timed[]) => {
  return list.length ? list[list.length - 1].time : 0;
};

// Same as mostRecentIndex, except it won't return the last item in the array
// for values that are beyond the known range
export function mostRecentContainedIndex<T extends Timed>(
  array: T[],
  time: number
): number | undefined {
  if (time > lastTime(array)) {
    return undefined;
  }
  return mostRecentIndex(array, time);
}

export function mostRecentEntry<T extends Timed>(array: T[], time: number) {
  const index = mostRecentIndex(array, time);
  return index !== undefined ? array[index] : null;
}

export function mostRecentContainedEntry<T extends Timed>(array: T[], time: number) {
  const index = mostRecentContainedIndex(array, time);
  return index !== undefined ? array[index] : null;
}

export function nextEntry<T extends Timed>(array: T[], time: number) {
  const index = mostRecentIndex(array, time);
  if (index === undefined) {
    return array.length ? array[0] : null;
  }
  return index + 1 < array.length ? array[index + 1] : null;
}

// Add an entry with a "time" property to an array that is sorted by time.
export function insertEntrySorted<T extends Timed>(array: T[], entry: T) {
  if (lastTime(array) <= entry.time) {
    array.push(entry);
  } else {
    const index = mostRecentIndex(array, entry.time);
    if (index !== undefined) {
      array.splice(index + 1, 0, entry);
    } else {
      array.unshift(entry);
    }
  }
}

export function closerEntry<T1 extends Timed, T2 extends Timed>(
  time: number,
  entry1: T1 | null,
  entry2: T2 | null
) {
  if (!entry1) {
    return entry2;
  }
  if (!entry2) {
    return entry1;
  }
  if (Math.abs(time - entry1.time) < Math.abs(time - entry2.time)) {
    return entry1;
  }
  return entry2;
}

function NotAllowed(reason = "") {
  console.trace(`Not allowed${reason ? ` (${reason})` : ""}`);
}

// These field lookups can occur in local development.
// Even if the object _is_ expired and we want to deny access,
// there's no point in warning about these.
const KNOWN_IGNORABLE_OBJECT_FIELD_CHECKS = [
  "Symbol(immer-state)",
  "Symbol(immer-draftable)",
  "isReactComponent",
  "@@toStringTag",
  "splice",
];

export const DisallowEverythingProxyHandler: ProxyHandler<object> = {
  // getPrototypeOf() {
  //   NotAllowed();
  // },
  //has() {
  //  NotAllowed();
  //},
  //set() { NotAllowed(); },
  get(target, p) {
    if (KNOWN_IGNORABLE_OBJECT_FIELD_CHECKS.includes(p.toString())) {
      return;
    }
    NotAllowed("target: " + p.toString());
    return undefined;
  },
  apply(target, thisArg) {
    NotAllowed("apply: " + thisArg.toString());
  },
  construct() {
    NotAllowed("construct");
    return {};
  },
  getOwnPropertyDescriptor(target, p) {
    NotAllowed("gOPD: " + p.toString());
    return undefined;
  },
  ownKeys(target) {
    NotAllowed("ownKeys: " + target);
    return [];
  },
  isExtensible() {
    NotAllowed();
    return false;
  },
  setPrototypeOf() {
    NotAllowed();
    return false;
  },
  preventExtensions() {
    NotAllowed();
    return true;
  },
  defineProperty() {
    NotAllowed();
    return false;
  },
  deleteProperty() {
    NotAllowed();
    return false;
  },
};

export interface EventEmitter<T, E = string> {
  eventListeners: Map<E, ((value?: T) => void)[]>;
  on: (name: E, handler: (value?: T) => void) => void;
  off: (name: E, handler: (value?: T) => void) => void;
  emit: (name: E, value?: T) => void;
}

export const EventEmitter = {
  decorate<T, E = string>(obj: EventEmitter<T, E>) {
    obj.eventListeners = new Map<E, ((value?: T) => void)[]>();

    obj.on = (name, handler) => {
      if (obj.eventListeners.has(name)) {
        obj.eventListeners.get(name)!.push(handler);
      } else {
        obj.eventListeners.set(name, [handler]);
      }
    };

    obj.off = (name, handler) => {
      obj.eventListeners.set(
        name,
        (obj.eventListeners.get(name) || []).filter(h => h != handler)
      );
    };

    obj.emit = (name, ...values) => {
      (obj.eventListeners.get(name) || []).forEach(handler => handler(...values));
    };
  },
};

// Map from keys to arrays of values.
export class ArrayMap<K, V> {
  map: Map<K, V[]>;

  constructor() {
    this.map = new Map<K, V[]>();
  }

  add(key: K, value: V) {
    if (this.map.has(key)) {
      this.map.get(key)!.push(value);
    } else {
      this.map.set(key, [value]);
    }
  }
}

/**
 * Compare 2 integers encoded as numeric strings, because we want to avoid using BigInt (for now).
 * This will only work correctly if both strings encode positive integers (without decimal places),
 * using the same base (usually 10) and don't use "fancy stuff" like leading "+", "0" or scientific
 * notation.
 */
export function compareNumericStrings(a: string, b: string) {
  return a.length < b.length ? -1 : a.length > b.length ? 1 : a < b ? -1 : a > b ? 1 : 0;
}
