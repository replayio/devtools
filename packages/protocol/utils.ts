import { SourceLocation, TimeStampedPoint } from "@replayio/protocol";

type ErrorHandler = (error: Error) => void;

let errorHandler: ErrorHandler = (error: Error) => {
  throw error;
};

// By default, this package throw Errors.
// You can override that behavior with this method (e.g. to log errors to Sentry).
export function setErrorHandler(customErrorHandler: ErrorHandler) {
  errorHandler = customErrorHandler;
}

export function handleError(err: any) {
  errorHandler(err);
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

export function waitForTime(ms: number) {
  const start = Date.now();
  return new Promise<number>(resolve => {
    setTimeout(() => {
      const end = Date.now();
      resolve(end - start);
    }, ms);
  });
}

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

export function transformSupplementalId(id: string, supplementalIndex: number) {
  if (!supplementalIndex) {
    return id;
  }
  return `s${supplementalIndex}-${id}`;
}

export function breakdownSupplementalId(id: string): { id: string, supplementalIndex: number } {
  const match = /^s(\d+)-(.*)/.exec(id);
  if (!match) {
    return { id, supplementalIndex: 0 };
  }
  const supplementalIndex = +match[1];
  assert(supplementalIndex > 0);
  return { id: match[2], supplementalIndex };
}

export function sameSupplementalIndex(idA: string, idB: string) {
  return breakdownSupplementalId(idA).supplementalIndex == breakdownSupplementalId(idB).supplementalIndex;
}

/*
 * Compare 2 integers encoded as numeric strings, because we want to avoid using BigInt (for now).
 * This will only work correctly if both strings encode positive integers (without decimal places),
 * using the same base (usually 10) and don't use "fancy stuff" like leading "+", "0" or scientific
 * notation.
 */
function compareNumericIntegers(a: string, b: string) {
  return a.length < b.length ? -1 : a.length > b.length ? 1 : a < b ? -1 : a > b ? 1 : 0;
}

// Compare execution points, which must be from the same recording.
export function compareExecutionPoints(transformedA: string, transformedB: string) {
  const { id: a, supplementalIndex: indexA } = breakdownSupplementalId(transformedA);
  const { id: b, supplementalIndex: indexB } = breakdownSupplementalId(transformedB);
  assert(indexA == indexB, `Points ${transformedA} and ${transformedB} are not comparable`);
  return compareNumericIntegers(a, b);
}

// Compare execution points along with their times. Falls back onto time
// comparison for points from different recordings.
export function compareTimeStampedPoints(transformedA: TimeStampedPoint, transformedB: TimeStampedPoint) {
  const { id: a, supplementalIndex: indexA } = breakdownSupplementalId(transformedA.point);
  const { id: b, supplementalIndex: indexB } = breakdownSupplementalId(transformedB.point);
  if (indexA == indexB) {
    return compareNumericIntegers(a, b);
  }
  return transformedA.time - transformedB.time;
}

export function locationsInclude(haystack: SourceLocation[], needle: SourceLocation) {
  return haystack.some(
    location => location.line === needle.line && location.column === needle.column
  );
}
