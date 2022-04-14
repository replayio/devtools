import * as Sentry from "@sentry/browser";

export function assert(v: any, why = ""): asserts v {
  if (!v) {
    const error = new Error(`Assertion Failed: ${why}`);
    Sentry.captureException(error);
    throw error;
  }
}
