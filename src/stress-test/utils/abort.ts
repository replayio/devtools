/* Copyright 2022 Record Replay Inc. */

/**
 * Utility functions for working with AbortSignal objects and generally
 * interacting with asynchronous operations that you may want to cancel.
 *
 * The core tenets of abortable code that we want to aim for are:
 *  1. Only functions that are passed a signal may throw an AbortError.
 *  2. A function may only throw an abort error if given a signal that then aborted.
 *
 * These rules are our means of encoding our expectations about what aborting means.
 * Described another way, they can be viewed through the lense of:
 *  * An AbortSignal indicates that a function may be aborted.
 *  * An AbortError must only be thrown in response to an aborted signal.
 *  * Only the caller of a function can know if the result is needed,
 *    so only the caller is allowed to externally trigger an abort.
 */

import events from "events";
import { assert, ThrowError } from "./assert";
import { newPromise, Reject, Resolve } from "./promise";
import { Result, resultForFailure, resultForSuccess } from "./result";

// We're only exporting the type because don't want anything outside of this
// file to be constructing these abort errors. Those places should be using
// the helpers below.
export type { AbortError };

class AbortError extends Error {
  name = "AbortError";

  constructor() {
    super("aborted with signal");
  }
}

/**
 * Create a new signal object that will abort its signal as soon as the handler has
 * completed so that any unexpected exceptions or exit paths ensure that we abort
 * as much as possible in-progress work, since we know it won't be used.
 * If a signal is passed as the second argument, the inner signal will also abort
 * if the parent signal aborts.
 *
 * This function returns an AbortResult because if it threw an AbortError, it would
 * be breaking our requirement that things only throw AbortErrors across boundaries
 * where the parent signal has been aborted, but for this case the function may also
 * abort if the doAbort callback is called.
 *
 * Example:
 *
 *   // Start a bunch of parallel processing, and if any fail then the abort
 *   // scope will abort the signal and any other in-progress operations can stop.
 *   await createAbortScope(async signal => {
 *     await Promise.all(items.map(item => doThing(item, signal)))
 *   }, handler.signal);
 */
export async function createAbortRoot<T>(
  handler: (signal: AbortSignal, doAbort: () => void) => Promise<T>,
  parentSignal?: AbortSignal
): Promise<AbortResult<T>> {
  const controller = new AbortController();
  const { signal } = controller;
  const doAbort = () => controller.abort();

  try {
    const value = await withSignalAbortHandler(
      () => verifyAbortBoundary(() => handler(signal, doAbort), signal),
      parentSignal,
      doAbort
    );
    return resultForSuccess(value);
  } catch (err) {
    if (err instanceof AbortError) {
      return resultForFailure(undefined);
    }
    throw err;
  } finally {
    controller.abort();
  }
}

/**
 * Create a new signal object that will abort its signal as soon as the handler has
 * completed so that any unexpected exceptions or exit paths ensure that we abort
 * as much as possible in-progress work, since we know it won't be used.
 * If a signal is passed as the second argument, the inner signal will also abort
 * if the parent signal aborts.
 *
 * Example:
 *
 *   // Start a bunch of parallel processing, and if any fail then the abort
 *   // scope will abort the signal and any other in-progress operations can stop.
 *   await createAbortScope(async signal => {
 *     await Promise.all(items.map(item => doThing(item, signal)))
 *   }, handler.signal);
 */
export async function createAbortScope<T>(
  handler: (signal: AbortSignal) => Promise<T>,
  parentSignal?: AbortSignal
): Promise<T> {
  const controller = new AbortController();
  const { signal } = controller;
  const doAbort = () => controller.abort();

  try {
    return await withSignalAbortHandler(
      () => verifyAbortBoundary(() => handler(signal), signal),
      parentSignal,
      doAbort
    );
  } finally {
    controller.abort();
  }
}

/**
 * If we want to swallow errors, we want it to be very obvious when
 * we're doing that, so using an enum instead of a boolean.
 */
export enum PostAbortErrorHandling {
  // Log the error to the logger. This is the default and is probably
  // what you want if you're got a promise that rejects.
  LogError,
  // Silently ignore any errors that are thrown after abort.
  // This is what you want if you're 100% sure you're logging or
  // handling any post-abort errors.
  // If you use this, please try to add a comment about why you're
  // confident it is safe.
  Swallow,
}

/**
 * Allow people to use a callback to decide what to do with a post-abort error.
 */
export type PostAbortErrorCallback = (err: unknown) => Promise<void> | void;

/**
 * Run a handler either returning the handler's result, or aborting immediately
 * if the signal fires. If the signal is already aborted, the handler will
 * be skipped entirely.
 *
 * This function serves two similar tasks:
 *
 * 1. Adding abort supprt to logic that does not support aborting.
 * 2. Add racing behavior to a logic that can handle aborting, but may do so
 *    more slowly that is desirable in some cases. Ideally functions that are
 *    _known_ to be slow to throw on abort would use this internally so that all
 *    functions that take an abort signal will abort on the next possible moment
 *    where it wouldn't interfere with their ability to do their job.
 *
 * Note: When wrapping a handler with this function, keep in mind that the
 * handler itself can still succeed, so it if would have caused side-effects,
 * those affects can still happen and may need to be handled somehow.
 *
 * Example:
 *
 *   // If doSlowAsyncOperation doesn't accept a signal, this will allow your code
 *   // to abort instead of waiting for the slow operation.
 *   const value = await abortOnSignal(() => doSlowAsyncOperation(), signal);
 *
 *   // If doSlowAsyncOperation does accept a signal, this will allow your code
 *   // to abort immediately rather than having to wait for the abort
 *   // signal to be recognized and handled by the operation logic.
 *   const value = await abortOnSignal(() => doSlowAsyncOperation(signal), signal);
 */
export async function abortOnSignal<T>(
  handler: () => Promise<T>,
  signal: AbortSignal | undefined,
  errorHandling: PostAbortErrorHandling | PostAbortErrorCallback = PostAbortErrorHandling.LogError
): Promise<T> {
  return newAbortablePromise((resolve, reject) => {
    let didAbort = false;
    handler().then(
      v => {
        if (didAbort) {
          // If the abort was called, we silently discard this result value. This
          // is a big part of what makes this function a bit dangerous.
          return;
        }
        resolve(v);
      },
      err => {
        if (didAbort) {
          // Allow the handler to throw an abort error silently after abort,
          // since that's entirely reasonable and allows us to use this
          // function to race other abortable code easily.
          if (!(err instanceof AbortError)) {
            logAbortOnSignalPostAbortError(err, errorHandling);
          }
          return;
        }

        reject(err);
      }
    );
    return () => {
      // We have no logic to perform to clean up this abort signal, which
      // is one of the things that makes this function a bit dangerous.
      didAbort = true;
    };
  }, signal);
}
function logAbortOnSignalPostAbortError(
  err: unknown,
  errorHandling: PostAbortErrorHandling | PostAbortErrorCallback
) {
  if (errorHandling === PostAbortErrorHandling.Swallow) {
    return;
  }

  if (errorHandling === PostAbortErrorHandling.LogError) {
    return;
  }

  try {
    errorHandling(err);
  } catch (err) {}
}

/**
 * Run a handler similar to the one passed to "new Promise()" with additional
 * abort handling and strict expectations around when callbacks may run. The
 * core requirement of this function is that neither the resolve nor reject
 * functions may be called once an abort has occured, and once a resolve/reject
 * handler have been called, the abort handler is guaranteed _not_ to be called.
 *
 * This function is critical for cases where yielding back to the event loop could
 * put us at risk of racy behavior. It's also just nicer to use than abortOnSignal
 * and makes it easier to adapt existing code to be abortable.
 */
export type AbortPromiseCleanupCallback = () => void;
export async function newAbortablePromise<T>(
  executor: (resolve: Resolve<T>, reject: Reject) => AbortPromiseCleanupCallback,
  signal: AbortSignal | undefined
): Promise<T> {
  let onAbort = () => {};
  return await withSignalAbortHandler(
    async () =>
      verifyAbortBoundary(
        async () =>
          newPromise((resolve, reject) => {
            let abortDone = false;
            let executorDone = false;

            const executorOnAbort = executor(
              value => {
                assert(
                  !abortDone,
                  "unexpected resolve callback after abort, abort handler should have cleaned up"
                );
                executorDone = true;
                resolve(value);
              },
              err => {
                assert(
                  !abortDone,
                  "unexpected reject callback after abort, abort handler should have cleaned up"
                );
                executorDone = true;
                reject(err);
              }
            );

            onAbort = () => {
              assert(signal);
              abortDone = true;

              if (!executorDone) {
                reject(createAbortError(signal));
                executorOnAbort();
              }
            };
            // The executor could have aborted the handler before we assigned the
            // this onAbort handler, so we have to manually run it.
            if (signal?.aborted) {
              onAbort();
            }
          }),
        signal
      ),
    signal,
    () => onAbort()
  );
}

/**
 * Run a given handler and while the result is pending, listen for abort
 * notifications on the given signal. If an already-aborted signal is passed,
 * the handler will be skipped entirely.
 *
 * This function that is most likely to come up when interfacing between
 * code that may be passed an abort signal, but has to interact with
 * logic that doesn't know how to handle that signal, but can be aborted.
 */
export async function withSignalAbortHandler<T>(
  handler: () => Promise<T>,
  signal: AbortSignal | undefined,
  onAbort: () => void
): Promise<T> {
  if (!signal) {
    return handler();
  }

  throwIfAborted(signal);

  // Make sure the callback has a unique object identity.
  const callback = onAbort.bind(undefined);

  // There don't appear to be type definitions for this but it's there!
  // Without this we'll get MaxListenersExceededWarning warnings.
  (events as any).setMaxListeners(0, signal);
  try {
    signal.addEventListener("abort", callback);
    return await handler();
  } finally {
    signal.removeEventListener("abort", callback);
  }
}

/**
 * Wrap a promise in a handler to silence abort exceptions by converting them
 * into a value instead.
 *
 * Example:
 *
 *   // If doOperation is aborted, 'value' will be 42 instead of the result
 *   // of the operation.
 *   const value = await abortToDefaultValue(doOperation(signal), 42);
 *   console.log(value);
 */
export async function abortToDefaultValue<T>(promise: Promise<T>, value: T): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    if (err instanceof AbortError) {
      return value;
    }
    throw err;
  }
}

/**
 * Wrap a promise in a handler to silence abort exceptions by converting them
 * into a simple Result object instead.
 *
 * Example:
 *
 *   // If doOperation is aborted, 'value' will be 42 instead of the result
 *   // of the operation.
 *   const result = await abortToResult(doOperation(signal));
 *   if (result.type === "success") {
 *     console.log(result.value);
 *   } else {
 *     console.log(42);
 *   }
 *
 */
export type AbortResult<T> = Result<T, undefined>;
export async function abortToResult<T>(promise: Promise<T>): Promise<AbortResult<T>> {
  try {
    return resultForSuccess(await promise);
  } catch (err) {
    if (err instanceof AbortError) {
      return resultForFailure(undefined);
    }
    throw err;
  }
}

/**
 * Throw an abort error if the signal has been aborted.
 */
export function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw createAbortError(signal);
  }
}

/**
 * Throw an abort error.
 */
export function throwAborted(signal: AbortSignal): never {
  throw createAbortError(signal);
}

/**
 * Create an error object without throwing it.
 *
 * This shouldn't come up very often since the throwing functions are generally
 * earlier to use in day-to-day code, but it happens.
 */
export function createAbortError(signal: AbortSignal): AbortError {
  assert(signal.aborted, "tried to abort without aborted signal");
  return new AbortError();
}

/**
 * A utility function to enforce some of our expectations around abortable functions.
 */
async function verifyAbortBoundary<T>(
  handler: () => Promise<T>,
  signal: AbortSignal | undefined
): Promise<T> {
  try {
    return await handler();
  } catch (err) {
    if (err instanceof AbortError) {
      if (signal) {
        assert(signal.aborted, "unexpected abort across an un-aborted boundary");
      } else {
        ThrowError("unexpected abort when no abort signal was passed");
      }
    }
    throw err;
  }
}
