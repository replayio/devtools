import assert from "assert";
import { Message, PointRange } from "@replayio/protocol";
import {
  IntervalCacheLoadOptions,
  StreamingValue,
  createIntervalCache,
  createStreamingCache,
} from "suspense";

import {
  isExecutionPointsGreaterThan,
  isExecutionPointsLessThan,
} from "replay-next/src/utils/time";
import type { ReplayClientInterface } from "shared/client/types";

import { cachePauseData } from "./PauseCache";
import { sourcesCache } from "./SourcesCache";

export type CategoryCounts = {
  errors: number;
  logs: number;
  warnings: number;
};

export type MessageMetadata = {
  categoryCounts: CategoryCounts;
  countAfter: number;
  countBefore: number;
  didOverflow: boolean;
};

const findMessagesInRangeIntervalCache = createIntervalCache<
  bigint,
  [client: ReplayClientInterface],
  Message
>({
  debugLabel: "Console.findMessagesInRange",
  load: async (
    begin: BigInt,
    end: BigInt,
    client: ReplayClientInterface,
    options: IntervalCacheLoadOptions<Message>
  ) => {
    const { messages, overflow } = await client.findMessagesInRange({
      begin: begin.toString(),
      end: end.toString(),
    });
    return overflow ? options.returnAsPartial(messages) : messages;
  },
  getPointForValue: (value: Message): bigint => {
    return BigInt(value.point.point);
  },
});

const findMessagesStreamingCache = createStreamingCache<
  [client: ReplayClientInterface],
  Message[],
  {
    overflow: boolean;
  }
>({
  debugLabel: "Console.findMessages",
  getKey: () => "global",
  load: async (options, client) => {
    const { update, reject, resolve, signal } = options;

    let messages: Message[] = [];

    try {
      const { value: { idToSource } = {} } = await sourcesCache.readAsync(client);
      assert(idToSource != null);

      const { overflow } = await client.findMessages(message => {
        cachePauseData(client, idToSource, message.pauseId, message.data);

        if (signal.aborted) {
          return false;
        }

        messages = messages.concat(message);

        update(messages);

        return true;
      });

      if (!signal.aborted) {
        update(messages, undefined, { overflow });
        resolve();
      }
    } catch (error) {
      if (!signal.aborted) {
        reject(error);
      }
    }
  },
});

let stream: StreamingValue<
  Message[],
  {
    overflow: boolean;
  }
> | null = null;

// Composite cache that loads Messages as efficiently as possible for the common case recording
// First it tries to load them from the streaming Console.findMessages API (findMessagesStreamingCache)
// If results are found, they are filtered in-memory before being returned
// If results overflowed, the Console.findMessagesInRange API is used (findMessagesInRangeIntervalCache)
export const streamingMessagesCache = createStreamingCache<
  [client: ReplayClientInterface, pointRange: PointRange],
  Message[],
  MessageMetadata
>({
  debugLabel: "Messages (composite cache)",
  getKey: (client, pointRange) => `${pointRange.begin}-${pointRange.end}`,
  load: async (options, client, pointRange) => {
    const { update, reject, resolve, signal } = options;

    const begin = BigInt(pointRange.begin);
    const end = BigInt(pointRange.end);

    let countAfter = 0;
    let countBefore = 0;
    let didOverflow = false;
    let errors = 0;
    let logs = 0;
    let messages: Message[] = [];
    let unsubscribe: Function | null = null;
    let warnings = 0;

    try {
      if (stream === null) {
        stream = findMessagesStreamingCache.stream(client);
      }

      // If the streaming API has already overflowed, we can skip it.
      // This avoids having to unnecessarily filter messages in memory.
      if (!stream.data || !stream.data.overflow) {
        let startIndex = 0;

        const processPendingMessages = () => {
          const newMessages: Message[] = [];
          if (stream && stream.value) {
            // Process new messages; filter for the specified range.
            for (let index = startIndex; index < stream.value.length; index++) {
              const message = stream.value[index];

              const executionPoints = message.point.point;
              if (isExecutionPointsLessThan(executionPoints, pointRange.begin)) {
                countBefore++;
              } else if (isExecutionPointsGreaterThan(executionPoints, pointRange.end)) {
                countAfter++;
              } else {
                newMessages.push(message);

                switch (message.level) {
                  case "assert":
                  case "info":
                  case "trace":
                    logs++;
                    break;
                  case "error":
                    errors++;
                    break;
                  case "warning":
                    warnings++;
                    break;
                }
              }
            }

            if (newMessages.length) {
              // We use .concat() instead of .push() intentionally
              // so that updates will trigger React renders
              messages = messages.concat(...newMessages);
            }

            startIndex = stream.value.length;

            update(messages, undefined, {
              categoryCounts: { errors, logs, warnings },
              countBefore,
              countAfter,
              didOverflow,
            });
          }
        };

        unsubscribe = stream.subscribe(processPendingMessages);

        await stream.resolver;

        unsubscribe();
        unsubscribe = null;

        // If this cache is re-running after the streaming API has already resolved,
        // the on-change subscription won't have fired;
        // in that we should process any pending/missed messages before continuing.
        processPendingMessages();
      }

      if (!stream.data?.overflow) {
        // If data still hasn't overflowed, we're done.
        if (!signal.aborted) {
          resolve();
        }
        return;
      }

      // If we've made it this far, the streaming API has overflowed.
      // We need to fall back to the non-streaming API.
      messages = await findMessagesInRangeIntervalCache.readAsync(begin, end, client);
      didOverflow = findMessagesInRangeIntervalCache.isPartialResult(messages);

      if (!signal.aborted) {
        update(messages, undefined, {
          categoryCounts: getCategoryCounts(messages),
          didOverflow,

          // There's no way to know these counts when we're using the range API
          countBefore: 0,
          countAfter: 0,
        });
        resolve();
      }
    } catch (error) {
      if (!signal.aborted) {
        reject(error);
      }
    } finally {
      if (unsubscribe) {
        unsubscribe();
      }
    }
  },
});

function getCategoryCounts(messages: Message[]): CategoryCounts {
  let errors = 0;
  let logs = 0;
  let warnings = 0;

  messages.forEach(message => {
    switch (message.level) {
      case "assert":
      case "info":
      case "trace":
        logs++;
        break;
      case "error":
        errors++;
        break;
      case "warning":
        warnings++;
        break;
    }
  });

  return {
    errors,
    logs,
    warnings,
  };
}
