import { Message, PointRange } from "@replayio/protocol";

import { ReplayClientInterface } from "../../../shared/client/types";

import { createWakeable } from "../utils/suspense";
import { isRangeEqual, isRangeSubset } from "../utils/time";

import { preCacheObjects } from "./ObjectPreviews";
import { Wakeable } from "./types";

export type ProtocolMessage = Message & {
  type: "ProtocolMessage";
};

// TODO Should I use React's Suspense cache APIs here?
// It's tempting to think that I don't need to, because the recording session data is global,
// but could this cause problems if React wants to render a high-priority update while a lower one is suspended?

let inFlightWakeable: Wakeable<ProtocolMessage[]> | null = null;
let inFlightPointRange: PointRange | null = null;

let lastFetchDidOverflow: boolean = false;
let lastFetchedPointRange: PointRange | null = null;
let lastFetchedMessages: ProtocolMessage[] | null = null;

let lastFilteredPointRange: PointRange | null = null;
let lastFilteredMessages: ProtocolMessage[] | null = null;
let lastFilteredCountAfter: number = 0;
let lastFilteredCountBefore: number = 0;

type getMessagesResponse = {
  countAfter: number;
  countBefore: number;
  didOverflow: boolean;
  messages: ProtocolMessage[];
};

// Synchronously returns an array of filtered Messages,
// or throws a Wakeable to be resolved once messages have been fetched.
//
// This method is Suspense friend; it is meant to be called from a React component during render.
export function getMessages(
  client: ReplayClientInterface,
  pointRange: PointRange | null
): getMessagesResponse {
  if (pointRange !== null && pointRange.begin === pointRange.end) {
    // Edge case scenario handling.
    // The backend throws if both points in a range are the same.
    // Arguably it should handle this more gracefully by just returning an empty array but...
    return {
      countAfter: -1,
      countBefore: -1,
      didOverflow: false,
      messages: [],
    };
  }

  if (inFlightWakeable !== null) {
    // If we're already fetching this data, rethrow the same Wakeable (for Suspense reasons).
    // We check equality here rather than subset because it's possible a larger range might overflow.
    if (isRangeEqual(inFlightPointRange, pointRange)) {
      throw inFlightWakeable;
    }
  }

  // We only need to refetch data if one of the following conditions is true.
  let shouldFetch = false;
  if (lastFetchedMessages === null) {
    // We have not yet fetched it at all.
    shouldFetch = true;
  } else if (lastFetchDidOverflow && !isRangeEqual(lastFetchedPointRange, pointRange)) {
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
  } else if (!isRangeSubset(lastFetchedPointRange, pointRange)) {
    // The new focus region is outside of the most recent region we fetched messages for.
    shouldFetch = true;
  }

  if (shouldFetch) {
    inFlightPointRange = pointRange;

    const wakeable = (inFlightWakeable = createWakeable());

    fetchMessages(client, pointRange, wakeable);

    throw inFlightWakeable;
  }

  // At this point, messages have been fetched but we may still need to filter them.
  // For performance reasons (both in this function and on things that consume the filtered list)
  // it's best if we memoize this operation (by comparing ranges) to avoid recreating the filtered array.
  if (lastFilteredMessages === null || !isRangeEqual(lastFilteredPointRange, pointRange)) {
    if (pointRange === null) {
      lastFilteredPointRange = null;
      lastFilteredCountAfter = 0;
      lastFilteredCountBefore = 0;
      lastFilteredMessages = lastFetchedMessages;
    } else {
      const begin = pointRange.begin;
      const end = pointRange.end;

      lastFilteredPointRange = pointRange;
      lastFilteredCountAfter = 0;
      lastFilteredCountBefore = 0;
      lastFilteredMessages = lastFetchedMessages!.filter(message => {
        const point = message.point.point;
        if (point < begin) {
          lastFilteredCountBefore++;
          return false;
        } else if (point > end) {
          lastFilteredCountAfter++;
          return false;
        } else {
          return true;
        }
      });
    }
  }

  // Note that the only time when it's safe for us to specify the number of trimmed messages
  // is when we are trimming from the complete set of messages (aka no focus region).
  // Otherwise even if we do trim some messages locally, the number isn't meaningful.
  return {
    countAfter: lastFetchedPointRange === null ? lastFilteredCountAfter : -1,
    countBefore: lastFetchedPointRange === null ? lastFilteredCountBefore : -1,
    didOverflow: lastFetchDidOverflow,
    messages: lastFilteredMessages!,
  };
}

async function fetchMessages(
  client: ReplayClientInterface,
  pointRange: PointRange | null,
  wakeable: Wakeable<ProtocolMessage[]>
) {
  try {
    const { messages, overflow } = await client.findMessages(pointRange);

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
      lastFetchedPointRange = pointRange;
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
    inFlightPointRange = null;
    inFlightWakeable = null;

    console.error("getMessage() Error for range", printPointRange(pointRange), error);

    wakeable.reject(error);
  }
}

function printPointRange(pointRange: PointRange | null): string {
  if (pointRange === null) {
    return "null";
  } else {
    return `${pointRange.begin}:${pointRange.end}`;
  }
}
