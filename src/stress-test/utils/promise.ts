/* Copyright 2022 Record Replay Inc. */

// Utility functions for promise handling.

import { assert, ThrowError } from "./assert";

type ObjectWithPromiseProps = Record<string, Promise<unknown>>;

export type AllProps<O extends ObjectWithPromiseProps> = {
  [K in keyof O]: O[K] extends Promise<infer U> ? U : O[K];
};

/**
 * Given an array of promises, return the index of the promise
 * that won the race.
 */
export async function racePromisesForIndex(promises: Array<Promise<unknown>>): Promise<number> {
  return Promise.race(
    promises.map((promise, i) =>
      promise.then(
        () => i,
        () => i
      )
    )
  );
}

/**
 * Like Promise.all(), but for an object instead of an array, and similarly
 * useful for running many process in parallel in a readable way.
 *
 * Given an object with promise properties, return a promise that will wait
 * for all of the properties to resolve, and then resolve with a new object
 * where each property is the resolved value. e.g.
 *
 *   const { one, two } = await allPromiseProps({
 *     one: fetch("/one").then(r => r.text()),
 *     two: fetch("/two").then(r => r.text()),
 *   });
 *   assert(typeof one === "string");
 *   assert(typeof two === "string");
 */
export async function allPromiseProps<O extends ObjectWithPromiseProps>(
  obj: O
): Promise<AllProps<O>> {
  return Object.fromEntries(
    await Promise.all(Object.entries(obj).map(async ([key, value]) => [key, await value]))
  );
}

// Time a promise from now.
export function timeAwait(promise: Promise<unknown>): Promise<number> {
  const start = Date.now();
  return new Promise(resolve => {
    const resolver = () => resolve(Date.now() - start);
    promise.then(resolver, resolver);
  });
}

export type Resolve<T> = (value: T) => void;
export type Reject = (reason: any) => void;

export interface Deferred<T> {
  promise: Promise<T>;
  resolve: Resolve<T>;
  reject: Reject;
}

export function defer<T>(): Deferred<T> {
  let resolve!: Resolve<T>;
  let reject!: Reject;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export async function hangForever(): Promise<never> {
  await new Promise(() => {});
  ThrowError("unreachable");
}

/**
 * Run an executor function the same way "new Promise()", but enforce additional
 * guarantees to ensure that we don't swallow data unexpectedly.
 *
 * An executor may do only one of:
 *   * Throw an exception
 *   * Call the resolve callback
 *   * Call the reject callback.
 *
 * Additionally, if the handler calls resolve or reject and then throws,
 * the exception will be logged instead of silently swallowed.
 */
export async function newPromise<T>(
  executor: (resolve: Resolve<T>, reject: Reject) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    let executorDone = false;
    let executorThrew = false;

    try {
      executor(
        value => {
          assert(!executorThrew, "unexpected resolve callback after executor threw");
          assert(!executorDone, "unexpected resolve call after another resolve/reject");
          executorDone = true;
          resolve(value);
        },
        err => {
          assert(!executorThrew, "unexpected resolve callback after executor threw");
          assert(!executorDone, "unexpected reject call after another resolve/reject");
          executorDone = true;
          reject(err);
        }
      );
    } catch (err) {
      executorThrew = true;
      if (executorDone) {
        // If something called resolve/reject synchronously and _then_ threw, the promise
        // constructor will swallow it, so here log it first.
        console.error("UnexpectedAbortExecutorFailure", err);
        return;
      }

      executorDone = true;
      throw err;
    }
  });
}
