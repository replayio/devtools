import { createStreamingCache } from "suspense";

export const TimeoutCache = createStreamingCache<
  [eventName: string, timeoutAfterMs: number],
  boolean
>({
  debugLabel: "TimeoutCache",
  getKey: (eventName: string, timeoutAfterMs: number) => `${eventName}:${timeoutAfterMs}`,
  load: async (options, _, timeoutAfterMs: number) => {
    const { resolve, signal, update } = options;

    update(false);

    const timeout = setTimeout(() => {
      update(true);
      resolve();
    }, timeoutAfterMs);

    signal.addEventListener("abort", () => {
      clearTimeout(timeout);
    });
  },
});
