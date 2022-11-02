import { TimeStampedPointRange } from "@replayio/protocol";

import { ReplayClientInterface } from "shared/client/types";
import { ProtocolError, isCommandError } from "shared/utils/error";

import { createWakeable } from "../utils/suspense";
import { isRangeEqual, isRangeSubset } from "../utils/time";
import { RemoteAnalysisResult } from "./AnalysisCache";
import { preCacheObjects } from "./ObjectPreviews";
import { Wakeable } from "./types";

export type UncaughtException = RemoteAnalysisResult & {
  type: "UncaughtException";
};

type Callback = () => void;
export type Status = "failed-too-many-points" | "fetched" | "request-in-progress" | "uninitialized";

const EMPTY_ARRAY: any[] = [];

let inFlightFocusRange: TimeStampedPointRange | null = null;
let inFlightWakeable: Wakeable<RemoteAnalysisResult[]> | null = null;
let lastFetchDidFailTooManyPoints: boolean = false;
let lastFetchedFocusRange: TimeStampedPointRange | null = null;
let lastFetchedExceptions: UncaughtException[] | null = null;
let lastFilteredExceptions: UncaughtException[] | null = null;
let lastFilteredFocusRange: TimeStampedPointRange | null = null;

const tooManyPointsListeners: Set<Callback> = new Set();

export function getStatus(): Status {
  if (inFlightWakeable !== null) {
    return "request-in-progress";
  } else if (lastFetchDidFailTooManyPoints) {
    return "failed-too-many-points";
  } else if (lastFetchedExceptions !== null) {
    return "fetched";
  } else {
    return "uninitialized";
  }
}

export function subscribeForStatus(callback: Callback): Callback {
  tooManyPointsListeners.add(callback);
  return function unsubscribeFromStatus() {
    tooManyPointsListeners.delete(callback);
  };
}

function notifyStatusSubscribers(): void {
  tooManyPointsListeners.forEach(callback => callback());
}

export function getExceptionsSuspense(
  client: ReplayClientInterface,
  focusRange: TimeStampedPointRange | null
): UncaughtException[] {
  if (focusRange !== null && focusRange.begin.point === focusRange.end.point) {
    // Edge case scenario handling.
    lastFetchedExceptions = lastFilteredExceptions = EMPTY_ARRAY;
    lastFetchedFocusRange = lastFilteredFocusRange = focusRange;

    notifyStatusSubscribers();

    return EMPTY_ARRAY;
  }

  if (inFlightWakeable !== null && isRangeEqual(inFlightFocusRange, focusRange)) {
    // If we're already fetching this data, rethrow the same Wakeable (for Suspense reasons).
    throw inFlightWakeable;
  }

  let shouldFetch = false;
  if (lastFetchedExceptions === null) {
    // This is the first time we're fetching data.
    shouldFetch = true;
  } else {
    if (!isRangeSubset(lastFetchedFocusRange, focusRange)) {
      // The new range is bigger than the old range so we need to fetch again.
      shouldFetch = true;
    } else {
      if (!isRangeEqual(lastFetchedFocusRange, focusRange)) {
        // The new range is smaller than the old one
        if (lastFetchDidFailTooManyPoints) {
          // The last time we tried to fetch overflowed, so we should try again.
          shouldFetch = true;
        }
      }
    }
  }

  if (shouldFetch) {
    inFlightFocusRange = focusRange;
    inFlightWakeable = createWakeable();

    fetchExceptions(client);

    notifyStatusSubscribers();

    throw inFlightWakeable;
  }

  if (focusRange === null) {
    lastFilteredExceptions = lastFetchedExceptions;
    lastFilteredFocusRange = focusRange;
  } else if (!isRangeEqual(lastFilteredFocusRange, focusRange)) {
    lastFilteredExceptions = lastFetchedExceptions!.filter(exception => {
      return exception.point >= focusRange.begin.point && exception.point <= focusRange.end.point;
    });
    lastFilteredFocusRange = focusRange;
  }

  return lastFilteredExceptions!;
}

async function fetchExceptions(client: ReplayClientInterface) {
  const wakeable = inFlightWakeable!;

  try {
    const results = await client.runAnalysis<RemoteAnalysisResult>({
      effectful: false,
      exceptionPoints: true,
      mapper: EXCEPTIONS_MAPPER,
      range: inFlightFocusRange
        ? { begin: inFlightFocusRange.begin.point, end: inFlightFocusRange.end.point }
        : undefined,
    });

    // Cache Object preview data since we have it.
    // This may save us from making unnecessary requests later.
    results.forEach(result => {
      if (result.data.objects) {
        preCacheObjects(result.pauseId, result.data.objects);
      }
    });

    if (wakeable === inFlightWakeable) {
      lastFetchDidFailTooManyPoints = false;
      lastFetchedExceptions = results.map(result => ({
        ...result,
        type: "UncaughtException",
      }));
      lastFetchedFocusRange = inFlightFocusRange;
    }

    // React doesn't use the resolved value.
    wakeable.resolve(null as any);
  } catch (error) {
    if (wakeable === inFlightWakeable && isCommandError(error, ProtocolError.TooManyPoints)) {
      lastFetchDidFailTooManyPoints = true;
      lastFetchedExceptions = EMPTY_ARRAY;
      lastFetchedFocusRange = inFlightFocusRange;
    } else {
      console.error(error);
    }

    // React doesn't use the resolved value.
    wakeable.resolve(null as any);
  } finally {
    if (wakeable === inFlightWakeable) {
      inFlightFocusRange = null;
      inFlightWakeable = null;

      notifyStatusSubscribers();
    }
  }
}

const EXCEPTIONS_MAPPER = `
  const finalData = { frames: [], scopes: [], objects: [] };

  function addPauseData({ frames, scopes, objects }) {
    finalData.frames.push(...(frames || []));
    finalData.scopes.push(...(scopes || []));
    finalData.objects.push(...(objects || []));
  }

  function getTopFrame() {
    const { data, frame: frameId } = sendCommand("Pause.getTopFrame");

    return (data.frames || []).find((f) => f.frameId == frameId);
  }

  const { pauseId, point, time } = input;
  const { frameId, location } = getTopFrame();
  const {
    data: { objects, scopes },
    exception,
  } = sendCommand("Pause.getExceptionValue");
  const {
    data: { frames },
  } = sendCommand("Pause.getAllFrames");

  addPauseData({ frames, objects, scopes });

  return [
    {
      key: time,
      value: {
        data: finalData,
        location,
        pauseId,
        point,
        time,
        values: [exception],
      },
    },
  ];
`;
