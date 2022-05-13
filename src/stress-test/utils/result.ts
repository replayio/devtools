/* Copyright 2022 Record Replay Inc. */

// Utilities for fallible operations that may want to separate out failures
// from exceptions to allow for cleaner handling of specific categories of errors.

export type SuccessResult<T> = { type: "success"; value: T; error?: undefined };
export type FailureResult<U = unknown> = { type: "failure"; value?: undefined; error: U };

export type Result<T, U = unknown> = SuccessResult<T> | FailureResult<U>;

/**
 * Create a result for a success value.
 */
export function resultForSuccess<T>(value: T): SuccessResult<T> {
  return {
    type: "success",
    value,
    error: undefined,
  };
}

/**
 * Create a result for a failue value.
 */
export function resultForFailure<U = unknown>(err: U): FailureResult<U> {
  return {
    type: "failure",
    value: undefined,
    error: err,
  };
}

/**
 * Convert a promise that may throw into a promise for a Result that will not throw.
 */
export async function resultFromPromise<T>(promise: Promise<T>): Promise<Result<T>> {
  try {
    return resultForSuccess(await promise);
  } catch (err) {
    return resultForFailure(err);
  }
}

/**
 * Return the value from a result or throw the failure value.
 */
export function resultUnwrap<T, U = unknown>(result: Result<T, U>): T {
  if (result.type === "success") {
    return result.value;
  }
  throw result.error;
}
