/* Copyright 2022 Record Replay Inc. */

// General utilities for timers.

import { newAbortablePromise } from "./abort";

/**
 * Queue up an interval like setInterval, but don't start a new handler until
 * the previous one has finished, and log a message if the handler takes longer
 * than the interval time to complete.
 */
export function setSingletonInterval(fn: () => unknown, ms: number) {
  const stack = new Error().stack;

  let shouldUnref = false;
  let timer: NodeJS.Timeout;

  async function handleInterval() {
    const start = Date.now();
    try {
      await fn();
    } finally {
      const duration = Date.now() - start;
      const timeToNextInterval = ms - duration;
      if (timeToNextInterval < 0) {
        console.debug("IntervalOvertime", {
          ms,
          duration,
          stack,
        });
      }
      timer = setTimeout(handleInterval, Math.max(timeToNextInterval, 0));
      if (shouldUnref) {
        timer.unref();
      }
    }
  }
  timer = setTimeout(handleInterval, ms);

  return {
    unref: () => {
      shouldUnref = true;
      timer.unref();
    },
  };
}

// Return a new callback that invokes the given callback at most every time ms.
export function throttle(callback: () => any, time: number) {
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

export async function waitForTime(
  ms: number,
  { signal, unref }: { signal?: AbortSignal; unref?: boolean } = {}
): Promise<undefined> {
  await newAbortablePromise(resolve => {
    const timer = setTimeout(resolve, ms);
    if (unref) {
      timer.unref();
    }
    return () => clearTimeout(timer);
  }, signal);

  return undefined;
}

export function timeoutAfterTime(ms: number) {
  return new Promise((_, reject) => setTimeout(() => reject("Timeout"), ms));
}

// Set a timeout that runs at the specified time, per Date.now().
export function setTimeoutAbsolute(callback: () => void, time: number): NodeJS.Timeout {
  const now = Date.now();
  const duration = Math.max(time - now, 0);
  return setTimeout(callback, duration);
}

export function hrtimeToMs([s, ns]: [number, number]): number {
  return s * 1000 + ns / (1000 * 1000);
}

// Resolve the promise at some point after all microtasks have
// been flushed and control has returned to the event loop.
export async function waitForEventLoop() {
  await waitForTime(1);
}
