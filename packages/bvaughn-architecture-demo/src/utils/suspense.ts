import { Wakeable } from "../types";

// A "thennable" is a subset of the Promise API.
// We could use a Promise as thennable, but Promises have a downside: they use the microtask queue.
// An advantage to creating a custom thennable is synchronous resolution (or rejection).
//
// A "wakeable" is a "thennable" that has convenience resolve/reject methods.
export function createWakeable(): Wakeable {
  const resolveCallbacks: Set<() => void> = new Set();
  const rejectCallbacks: Set<(error: Error) => void> = new Set();

  const wakeable: Wakeable = {
    then(resolveCallback: () => void, rejectCallback: (error: Error) => void) {
      resolveCallbacks.add(resolveCallback);
      rejectCallbacks.add(rejectCallback);
    },
    reject(error: Error) {
      rejectCallbacks.forEach(rejectCallback => {
        let thrownValue = null;

        try {
          rejectCallback(error);
        } catch (error) {
          thrownValue = error;
        }

        if (thrownValue !== null) {
          throw thrownValue;
        }
      });
    },
    resolve() {
      resolveCallbacks.forEach(resolveCallback => {
        let thrownValue = null;

        try {
          resolveCallback();
        } catch (error) {
          thrownValue = error;
        }

        if (thrownValue !== null) {
          throw thrownValue;
        }
      });
    },
  };

  return wakeable;
}

type AnyFunction = (...args: any[]) => any;

// Helper function to read from multiple Suspense caches in parallel.
// This method will re-throw any thrown value, but only after also calling subsequent caches.
export function suspendInParallel<T extends AnyFunction[]>(
  ...callbacks: [...T]
): { [K in keyof T]: ReturnType<Extract<T[K], AnyFunction>> } {
  const values: any[] = [];
  let thrownValue = null;

  callbacks.forEach(callback => {
    try {
      values.push(callback());
    } catch (error) {
      thrownValue = error;
    }
  });

  if (thrownValue !== null) {
    throw thrownValue;
  }

  return values as { [K in keyof T]: ReturnType<Extract<T[K], AnyFunction>> };
}
