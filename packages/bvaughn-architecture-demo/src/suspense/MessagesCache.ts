import { Message, TimeStampedPointRange } from "@replayio/protocol";

import { ReplayClientInterface } from "../../../shared/client/types";
import { isFirefoxInternalMessage } from "../utils/messages";
import { createWakeable } from "../utils/suspense";
import {
  isExecutionPointsGreaterThan,
  isExecutionPointsLessThan,
  isRangeEqual,
  isRangeSubset,
} from "../utils/time";
import { preCacheObjects } from "./ObjectPreviews";
import { Wakeable } from "./types";

export type ProtocolMessage = Message & {
  type: "ProtocolMessage";
};

export type CategoryCounts = {
  errors: number;
  logs: number;
  warnings: number;
};

export type MessageData = {
  categoryCounts: CategoryCounts;
  countAfter: number;
  countBefore: number;
  didOverflow: boolean;
  messages: ProtocolMessage[];
};

const EMPTY_ARRAY: any[] = [];

// TODO Should I use React's Suspense cache APIs here?
// It's tempting to think that I don't need to, because the recording session data is global,
// but could this cause problems if React wants to render a high-priority update while a lower one is suspended?

let inFlightWakeable: Wakeable<ProtocolMessage[]> | null = null;
let inFlightFocusRange: TimeStampedPointRange | null = null;

let lastFetchDidOverflow: boolean = false;
let lastFetchError: any | null = null;
let lastFetchedFocusRange: TimeStampedPointRange | null = null;
let lastFetchedMessages: ProtocolMessage[] | null = null;

let lastFilteredCategoryCounts: CategoryCounts | null = null;
let lastFilteredCountAfter: number = 0;
let lastFilteredCountBefore: number = 0;
let lastFilteredFocusRange: TimeStampedPointRange | null = null;
let lastFilteredMessages: ProtocolMessage[] | null = null;

// Synchronously returns an array of filtered Messages,
// or throws a Wakeable to be resolved once messages have been fetched.
//
// This method is Suspense friendly; it is meant to be called from a React component during render.
export function getMessagesSuspense(
  client: ReplayClientInterface,
  focusRange: TimeStampedPointRange | null
): MessageData {
  if (focusRange !== null && focusRange.begin.point === focusRange.end.point) {
    // Edge case scenario handling.
    // The backend throws if both points in a range are the same.
    // Arguably it should handle this more gracefully by just returning an empty array but...
    return {
      countAfter: -1,
      countBefore: -1,
      didOverflow: false,
      messages: EMPTY_ARRAY,
      categoryCounts: {
        errors: 0,
        logs: 0,
        warnings: 0,
      },
    };
  }

  if (inFlightWakeable !== null) {
    // If we're already fetching this data, rethrow the same Wakeable (for Suspense reasons).
    // We check equality here rather than subset because it's possible a larger range might overflow.
    if (isRangeEqual(inFlightFocusRange, focusRange)) {
      throw inFlightWakeable;
    }
  }

  // We only need to refetch data if one of the following conditions is true.
  let shouldFetch = false;
  if (lastFetchError !== null) {
    if (!isRangeEqual(lastFetchedFocusRange, focusRange)) {
      shouldFetch = true;
    }
  } else {
    if (lastFetchedMessages === null) {
      // We have not yet fetched it at all.
      shouldFetch = true;
    } else if (lastFetchDidOverflow && !isRangeEqual(lastFetchedFocusRange, focusRange)) {
      // The most recent time we fetched it "overflowed" (too many messages to send them all),
      // and we're trying to fetch a different region.
      //
      // There are two things to note about this case.
      // 1. When devtools is first opened, there is no focused region.
      //    This is equivalent to focusing on the entire timeline, so we often won't need to refetch messages when focusing for the first time.
      // 2. We shouldn't compare the new focus region to the most recent focus region,
      //    but rather to the most recent focus region that we fetched messages for (the entire timeline in many cases).
      //    If we don't need to refetch after zooming in, then we won't need to refetch after zooming back out either,
      //    (unless our fetches have overflowed at some point).
      shouldFetch = true;
    } else if (!isRangeSubset(lastFetchedFocusRange, focusRange)) {
      // The new focus region is outside of the most recent region we fetched messages for.
      shouldFetch = true;
    }
  }

  if (shouldFetch) {
    inFlightFocusRange = focusRange;

    const wakeable = (inFlightWakeable = createWakeable());

    fetchMessages(client, focusRange, wakeable);

    throw inFlightWakeable;
  }

  if (lastFetchError) {
    throw lastFetchError;
  }

  // TODO (FE-533) Filter Firefox internal browser exceptions (see isFirefoxInternalMessage)

  // At this point, messages have been fetched but we may still need to filter them.
  // For performance reasons (both in this function and on things that consume the filtered list)
  // it's best if we memoize this operation (by comparing ranges) to avoid recreating the filtered array.
  if (lastFilteredMessages === null || !isRangeEqual(lastFilteredFocusRange, focusRange)) {
    if (focusRange === null) {
      lastFilteredFocusRange = null;
      lastFilteredCountAfter = 0;
      lastFilteredCountBefore = 0;

      // HACK
      // Even if we aren't focused, the frontend needs to filter out Firefox internal messages.
      // This is something the runtime should probably do.
      // See BAC-2063
      lastFilteredMessages = lastFetchedMessages!.filter(
        message => !isFirefoxInternalMessage(message)
      );
    } else {
      const beginPoint = focusRange.begin.point;
      const endPoint = focusRange.end.point;

      lastFilteredFocusRange = focusRange;
      lastFilteredCountAfter = 0;
      lastFilteredCountBefore = 0;
      lastFilteredMessages = lastFetchedMessages!.filter(message => {
        // HACK See BAC-2063
        if (isFirefoxInternalMessage(message)) {
          return false;
        }

        const point = message.point.point;
        if (isExecutionPointsLessThan(point, beginPoint)) {
          lastFilteredCountBefore++;
          return false;
        } else if (isExecutionPointsGreaterThan(point, endPoint)) {
          lastFilteredCountAfter++;
          return false;
        } else {
          return true;
        }
      });
    }

    let errors = 0;
    let logs = 0;
    let warnings = 0;

    lastFilteredMessages!.forEach(message => {
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

    lastFilteredCategoryCounts = {
      errors,
      logs,
      warnings,
    };
  }

  // Note that the only time when it's safe for us to specify the number of trimmed messages
  // is when we are trimming from the complete set of messages (aka no focus region).
  // Otherwise even if we do trim some messages locally, the number isn't meaningful.
  return {
    categoryCounts: lastFilteredCategoryCounts!,
    countAfter: lastFetchedFocusRange === null ? lastFilteredCountAfter : -1,
    countBefore: lastFetchedFocusRange === null ? lastFilteredCountBefore : -1,
    didOverflow: lastFetchDidOverflow,
    messages: lastFilteredMessages!,
  };
}

async function fetchMessages(
  client: ReplayClientInterface,
  focusRange: TimeStampedPointRange | null,
  wakeable: Wakeable<ProtocolMessage[]>
) {
  try {
    const { messages, overflow } = await client.findMessages(focusRange);

    const protocolMessage: ProtocolMessage[] = messages.map(message => ({
      ...message,
      type: "ProtocolMessage",
    }));

    // Only update cached values if this request hasn't been superceded by a newer one.
    //
    // TODO In the future we could merge new messages over time (assuming no overflow)
    // to avoid re-fetching previously fetched ranges if a user scrubs around with the focus UI.
    // We'd have to be careful though to only merge data from overlapping points,
    // so that we didn't omit messages that happened between points.
    // I'm still a little unclear on the exact relationship between time and point.
    if (inFlightWakeable === wakeable) {
      inFlightWakeable = null;

      lastFetchDidOverflow = overflow;
      lastFetchError = null;
      lastFetchedFocusRange = focusRange;
      lastFetchedMessages = protocolMessage;

      // Pre-cache ObjectPreview data for this Message (PauseId).
      // This will avoid us having to turn around and request it again when rendering the logs.
      messages.forEach(message => {
        const objects = message.data.objects;
        if (objects) {
          preCacheObjects(message.pauseId, objects);
        }
      });
    }

    wakeable.resolve(protocolMessage);
  } catch (error) {
    inFlightFocusRange = null;
    inFlightWakeable = null;

    console.error("getMessage() Error for range", printPointRange(focusRange), error);

    lastFetchDidOverflow = false;
    lastFetchError = error;
    lastFetchedFocusRange = focusRange;
    lastFetchedMessages = null;

    wakeable.reject(error);
  }
}

function printPointRange(focusRange: TimeStampedPointRange | null): string {
  if (focusRange === null) {
    return "null";
  } else {
    return `${focusRange.begin.time}:${focusRange.end.time} (${focusRange.begin.point}:${focusRange.end.point})`;
  }
}
