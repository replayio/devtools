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
  assert(min < max);
  return Math.max(min, Math.min(max, value));
}

export function assert(condition: any, msg = "Assertion failed!"): asserts condition {
  if (!condition) {
    console.error(msg);
    throw new Error(msg);
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

function NotAllowed() {
  console.error("Not allowed");
}

export const DisallowEverythingProxyHandler: ProxyHandler<object> = {
  // getPrototypeOf() {
  //   NotAllowed();
  // },
  //has() {
  //  NotAllowed();
  //},
  //set() { NotAllowed(); },
  get() {
    return undefined;
  },
  apply() {
    NotAllowed();
  },
  construct() {
    NotAllowed();
    return {};
  },
  getOwnPropertyDescriptor() {
    NotAllowed();
    return undefined;
  },
  ownKeys() {
    NotAllowed();
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
