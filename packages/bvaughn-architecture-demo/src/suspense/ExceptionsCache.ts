import { isTooManyPointsError } from "@bvaughn/../shared/utils/error";
import { TimeStampedPointRange } from "@replayio/protocol";
import { ReplayClientInterface } from "shared/client/types";

import { createWakeable } from "../utils/suspense";
import { isRangeEqual, isRangeSubset } from "../utils/time";
import { RemoteAnalysisResult } from "./AnalysisCache";
import { preCacheObjects } from "./ObjectPreviews";

import { Wakeable } from "./types";

export type UncaughtException = RemoteAnalysisResult & {
  type: "UncaughtException";
};

type Callback = () => void;

const EMPTY_ARRAY: any[] = [];

let inFlightFocusRange: TimeStampedPointRange | null = null;
let inFlightWakeable: Wakeable<RemoteAnalysisResult[]> | null = null;
let lastFetchDidFailTooManyPoints: boolean = false;
let lastFetchedFocusRange: TimeStampedPointRange | null = null;
let lastFetchedExceptions: UncaughtException[] | null = null;
let lastFilteredExceptions: UncaughtException[] | null = null;
let lastFilteredFocusRange: TimeStampedPointRange | null = null;

const tooManyPointsListeners: Set<Callback> = new Set();

export function didExceptionsFailTooManyPoints(): boolean {
  return lastFetchDidFailTooManyPoints;
}

export function addTooManyPointsListeners(callback: Callback): Callback {
  tooManyPointsListeners.add(callback);
  return function unsubscribe() {
    tooManyPointsListeners.delete(callback);
  };
}

function setFetchDidFailTooManyPoints(value: boolean): void {
  if (lastFetchDidFailTooManyPoints !== value) {
    lastFetchDidFailTooManyPoints = value;
    tooManyPointsListeners.forEach(callback => callback());
  }
}

export function getExceptions(
  client: ReplayClientInterface,
  focusRange: TimeStampedPointRange | null
): UncaughtException[] {
  if (focusRange !== null && focusRange.begin.point === focusRange.end.point) {
    // Edge case scenario handling.
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
    } else if (!isRangeEqual(lastFetchedFocusRange, focusRange) && lastFetchDidFailTooManyPoints) {
      // The last time we tried to fetch overflowed,
      // but the new range is smaller so we should try again
      shouldFetch = true;
    }
  }

  if (shouldFetch) {
    inFlightFocusRange = focusRange;
    inFlightWakeable = createWakeable();

    fetchExceptions(client);

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
      lastFetchedExceptions = results.map(result => ({
        ...result,
        type: "UncaughtException",
      }));
      lastFetchedFocusRange = inFlightFocusRange;

      setFetchDidFailTooManyPoints(false);
    }

    // React doesn't use the resolved value.
    wakeable.resolve(null as any);
  } catch (error) {
    if (isTooManyPointsError(error) && wakeable === inFlightWakeable) {
      lastFetchedExceptions = EMPTY_ARRAY;
      lastFetchedFocusRange = inFlightFocusRange;

      setFetchDidFailTooManyPoints(true);
    } else {
      console.error(error);
    }

    // React doesn't use the resolved value.
    wakeable.resolve(null as any);
  } finally {
    if (wakeable === inFlightWakeable) {
      inFlightFocusRange = null;
      inFlightWakeable = null;
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
