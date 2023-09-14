import {
  FocusWindowRequestBias,
  PointRangeFocusRequest,
  TimeStampedPointRange,
} from "@replayio/protocol";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import useLoadedRegions from "replay-next/src/hooks/useLoadedRegions";
import {
  isTimeStampedPointRangeGreaterThan,
  isTimeStampedPointRangeLessThan,
} from "replay-next/src/utils/timeStampedPoints";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import {
  imperativelyGetClosestPointForTime,
  preCacheExecutionPointForTime,
} from "../suspense/ExecutionPointsCache";
import { TimeRange as TimeRangeArray } from "../types";
import { SessionContext } from "./SessionContext";

const FOCUS_DEBOUNCE_DURATION = 250;

interface TimeRange {
  begin: number;
  end: number;
}

export type UpdateOptions = {
  bias?: FocusWindowRequestBias;
  sync: boolean;
};

export type FocusContextType = {
  // Focus is about to be updated as part of a transition;
  // UI that consumes the focus for Suspense purposes may wish want reflect the temporary pending state.
  enterFocusMode: () => void;
  isTransitionPending: boolean;

  // The currently active range - use this for backend requests that don't cause components to suspend
  range: TimeStampedPointRange | null;
  // The range to be displayed in the Timeline - don't use this for backend requests
  rangeForDisplay: TimeRange | null;
  // The deferred value of the currently active range - use this for backend requests that may cause components to suspend
  rangeForSuspense: TimeStampedPointRange | null;

  // Set focus window to a range of execution points.
  update: (value: TimeStampedPointRange, options: UpdateOptions) => Promise<void>;

  // Set focus window to a range of times.
  // Note this value is imprecise and should only be used by the Timeline focuser UI.
  updateForTimelineImprecise: (
    value: TimeRangeArray | null,
    options: UpdateOptions
  ) => Promise<void>;
};

export const FocusContext = createContext<FocusContextType>(null as any);

export function FocusContextRoot({ children }: PropsWithChildren<{}>) {
  const client = useContext(ReplayClientContext);
  const { duration, endpoint } = useContext(SessionContext);
  const loadedRegions = useLoadedRegions();

  // Changing the focus range may cause us to suspend (while fetching new info from the backend).
  // Wrapping it in a transition enables us to show the older set of messages (in a pending state) while new data loads.
  // This is less jarring than the alternative of unmounting all messages and rendering a fallback loader.
  const initialRange = {
    begin: { point: "0", time: 0 },
    end: { point: endpoint, time: duration },
  };
  const [requestedRange, setRequestedRange] = useState<PointRangeFocusRequest | undefined>(
    undefined
  );
  const [range, setRange] = useState<TimeStampedPointRange>(initialRange);
  const [rangeForDisplay, setRangeForDisplay] = useState<TimeRange | null>({
    begin: 0,
    end: duration,
  });
  const [rangeForSuspense, setRangeForSuspense] = useState<TimeStampedPointRange>(initialRange);

  const prevRangeRef = useRef(range);

  // Using a deferred values enables the focus UI to update quickly,
  // and the slower operation of Suspending to load points to be deferred.
  //
  // It also allows us to update the UI slightly, before we suspend to fetch new data,
  // to indicate that what's currently being showed is stale.
  const [isTransitionPending, startTransition] = useTransition();

  useEffect(() => {
    if (!requestedRange) {
      return;
    }

    let cancelled = false;

    const timeoutId = setTimeout(async () => {
      const range = await client.requestFocusWindow(requestedRange);

      if (!cancelled) {
        setRangeForDisplay({ begin: range.begin.time, end: range.end.time });
        setRange(range);
        startTransition(() => {
          setRangeForSuspense(range);
        });
      }
    }, FOCUS_DEBOUNCE_DURATION);

    return () => {
      cancelled = true;

      clearTimeout(timeoutId);
    };
  }, [requestedRange, client]);

  // Feed loaded regions into the time-to-execution-point cache in case we need them later.
  useEffect(() => {
    if (loadedRegions != null) {
      loadedRegions.loaded.forEach(({ begin, end }) => {
        preCacheExecutionPointForTime(begin);
        preCacheExecutionPointForTime(end);
      });
    }
  }, [loadedRegions]);

  const updateFocusRange = useCallback(
    async (range: TimeStampedPointRange, options: UpdateOptions) => {
      let { bias } = options;

      // If the caller hasn't specified an explicit bias,
      // compare the new focus range to the previous one to infer user intent.
      // This helps when a focus range can't be loaded in full.
      if (bias == null && range != null) {
        const prevRange = prevRangeRef.current;
        if (prevRange != null) {
          if (isTimeStampedPointRangeLessThan(prevRange, range)) {
            bias = "begin";
          } else if (isTimeStampedPointRangeGreaterThan(prevRange, range)) {
            bias = "end";
          }
        }
      }

      setRangeForDisplay({ begin: range.begin.time, end: range.end.time });
      setRequestedRange({ ...range, bias });

      // Sync is a no-op
    },
    []
  );

  const updateForTimelineImprecise = useCallback(
    async (value: TimeRangeArray | null, options: UpdateOptions) => {
      if (!value) {
        setRangeForDisplay(null);
        return;
      }

      const { bias, sync } = options;

      const [timeBegin, timeEnd] = value;

      const [pointBegin, pointEnd] = await Promise.all([
        imperativelyGetClosestPointForTime(client, timeBegin),
        imperativelyGetClosestPointForTime(client, timeEnd),
      ]);

      updateFocusRange(
        {
          begin: { point: pointBegin, time: timeBegin },
          end: { point: pointEnd, time: timeEnd },
        },
        { bias, sync }
      );
    },
    [client, updateFocusRange]
  );

  const focusContext = useMemo<FocusContextType>(
    () => ({
      enterFocusMode: () => {},
      isTransitionPending,
      range,
      rangeForDisplay,
      rangeForSuspense,
      update: updateFocusRange,
      updateForTimelineImprecise,
    }),
    [
      isTransitionPending,
      range,
      rangeForDisplay,
      rangeForSuspense,
      updateFocusRange,
      updateForTimelineImprecise,
    ]
  );

  return <FocusContext.Provider value={focusContext}>{children}</FocusContext.Provider>;
}
