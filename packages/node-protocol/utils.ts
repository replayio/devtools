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

export function assert(condition: any, msg = "Assertion failed!"): asserts condition {
  if (!condition) {
    console.error(msg);
    throw new Error(msg);
  }
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
