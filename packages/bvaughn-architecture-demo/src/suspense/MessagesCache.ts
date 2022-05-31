import { Message, SessionId, TimeStampedPointRange } from "@replayio/protocol";
import { client } from "protocol/socket";

import { compareNumericStrings } from "../utils/string";
import { createWakeable } from "../utils/suspense";
import { formatTimestamp, isRangeEqual, isRangeSubset } from "../utils/time";
import { Wakeable } from "../types";

// TODO Should I use React's Suspense cache APIs here?
// It's tempting to think that I don't need to, because the recording session data is global,
// but could this cause problems if React wants to render a high-priority update while a lower one is suspended?

// TODO With a large recording (e.g. recordingId=244fac49-fc9c-4558-8819-25693e04292b)
// toggling focus off and back on again causes two sequential, visible render+suspend+resolve chunks.
// We should bail out on the first one once the second one comes in.
// React doesn't even try to render the second one while the first one is suspending though.

let inFlightWakeable: Wakeable | null = null;
let inFlightFocusRange: TimeStampedPointRange | null = null;

let lastFetchDidOverflow: boolean = false;
let lastFetchedFocusRange: TimeStampedPointRange | null = null;
let lastFetchedMessages: Message[] | null = null;

let lastFilteredFocusRange: TimeStampedPointRange | null = null;
let lastFilteredMessages: Message[] | null = null;
let lastFilteredCountAfter: number = 0;
let lastFilteredCountBefore: number = 0;

type getMessagesResponse = {
  countAfter: number;
  countBefore: number;
  didOverflow: boolean;
  messages: Message[];
};

// Synchronously returns an array of filtered Messages,
// or throws a Wakeable to be resolved once messages have been fetched.
//
// This method is Suspense friend; it is meant to be called from a React component during render.
export function getMessages(
  sessionId: SessionId,
  focusRange: TimeStampedPointRange | null
): getMessagesResponse {
  if (focusRange !== null && focusRange.begin.point === focusRange.end.point) {
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
    if (isRangeEqual(inFlightFocusRange, focusRange)) {
      throw inFlightWakeable;
    }
  }

  // We only need to refetch data if one of the following conditions is true.
  let shouldFetch = false;
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

  if (shouldFetch) {
    inFlightFocusRange = focusRange;

    const wakeable = (inFlightWakeable = createWakeable());

    fetchMessages(sessionId, focusRange, wakeable);

    throw inFlightWakeable;
  }

  // At this point, messages have been fetched but we may still need to filter them.
  // For performance reasons (both in this function and on things that consume the filtered list)
  // it's best if we memoize this operation (by comparing ranges) to avoid recreating the filtered array.
  if (lastFilteredMessages === null || !isRangeEqual(lastFilteredFocusRange, focusRange)) {
    if (focusRange === null) {
      lastFilteredFocusRange = null;
      lastFilteredCountAfter = 0;
      lastFilteredCountBefore = 0;
      lastFilteredMessages = lastFetchedMessages;
    } else {
      const begin = focusRange.begin.time;
      const end = focusRange.end.time;

      lastFilteredFocusRange = focusRange;
      lastFilteredCountAfter = 0;
      lastFilteredCountBefore = 0;
      lastFilteredMessages = lastFetchedMessages!.filter(message => {
        const time = message.point.time;
        if (time < begin) {
          lastFilteredCountBefore++;
          return false;
        } else if (time > end) {
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
    countAfter: lastFetchedFocusRange === null ? lastFilteredCountAfter : -1,
    countBefore: lastFetchedFocusRange === null ? lastFilteredCountBefore : -1,
    didOverflow: lastFetchDidOverflow,
    messages: lastFilteredMessages!,
  };
}

async function fetchMessages(
  sessionId: SessionId,
  focusRange: TimeStampedPointRange | null,
  wakeable: Wakeable
) {
  try {
    // TODO Replace these client references with ReplayClient instance.
    // Maybe that instance should have some of the "soft focus" and filtering logic baked into it.
    // This could simplify the React-specific APIs and how we mock/stub for testing.

    let messages: Message[] = null as unknown as Message[];
    let overflow: boolean = false;

    if (focusRange !== null) {
      const response = await client.Console.findMessagesInRange(
        { range: { begin: focusRange.begin.point, end: focusRange.end.point } },
        sessionId
      );

      messages = response.messages;
      overflow = response.overflow == true;
    } else {
      messages = [];

      // TOOD This won't work if there are every overlapping requests.
      client.Console.addNewMessageListener(({ message }) => {
        messages.push(message);
      });

      const response = await client.Console.findMessages({}, sessionId);

      client.Console.removeNewMessageListener();

      overflow = response.overflow === true;
    }

    // Only update cached values if this request hasn't been superceded by a newer one.
    //
    // TODO In the future we could merge new messages over time (assuming no overflow)
    // to avoid re-fetching previously fetched ranges if a user scrubs around with the focus UI.
    // We'd have to be careful though to only merge data from overlapping points,
    // so that we didn't omit messages that happened between points.
    // I'm still a little unclear on the exact relationship between time and point.
    if (inFlightWakeable === wakeable) {
      inFlightWakeable = null;

      // Messages aren't guaranteed to arrive sorted.
      // Presorting this unfiltered list now saves us from having to sort filtered lists later.
      //
      // TODO Is this only required for Console.findMessages()?
      // Can we skip it for Console.findMessagesInRange()?
      messages = messages.sort((messageA: Message, messageB: Message) => {
        const pointA = messageA.point.point;
        const pointB = messageB.point.point;
        return compareNumericStrings(pointA, pointB);
      });

      lastFetchDidOverflow = overflow;
      lastFetchedFocusRange = focusRange;
      lastFetchedMessages = messages;
    }

    wakeable.resolve();
  } catch (error) {
    inFlightFocusRange = null;
    inFlightWakeable = null;

    console.error("getMessage() Error for range", printFocusRange(focusRange), error);

    wakeable.reject(error);
  }
}

function printFocusRange(focusRange: TimeStampedPointRange | null): string {
  if (focusRange === null) {
    return "null";
  } else {
    return `${formatTimestamp(focusRange.begin.time)} - ${formatTimestamp(focusRange.end.time)} (${
      focusRange.begin.point
    }:${focusRange.end.point})`;
  }
}
