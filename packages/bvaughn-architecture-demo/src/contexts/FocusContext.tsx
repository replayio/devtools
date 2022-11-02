import { TimeStampedPointRange } from "@replayio/protocol";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import { ReplayClientContext } from "shared/client/ReplayClientContext";

import useDebouncedCallback from "../hooks/useDebouncedCallback";
import useLoadedRegions from "../hooks/useRegions";
import {
  imperativelyGetClosestPointForTime,
  preCacheExecutionPointForTime,
} from "../suspense/PointsCache";
import { Range } from "../types";
import { SessionContext } from "./SessionContext";

const FOCUS_DEBOUNCE_DURATION = 250;

export type FocusContextType = {
  // Focus is about to be updated as part of a transition;
  // UI that consumes the focus for Suspense purposes may wish want reflect the temporary pending state.
  isTransitionPending: boolean;
  range: TimeStampedPointRange | null;
  rangeForDisplay: TimeStampedPointRange | null;
  update: (value: Range | null, debounce: boolean) => void;
};

export const FocusContext = createContext<FocusContextType>(null as any);

export function FocusContextRoot({ children }: PropsWithChildren<{}>) {
  const client = useContext(ReplayClientContext);
  const { duration } = useContext(SessionContext);
  const loadedRegions = useLoadedRegions(client);

  // Changing the focus range may cause us to suspend (while fetching new info from the backend).
  // Wrapping it in a transition enables us to show the older set of messages (in a pending state) while new data loads.
  // This is less jarring than the alternative of unmounting all messages and rendering a fallback loader.
  const [range, setRange] = useState<TimeStampedPointRange | null>(null);
  const [deferredRange, setDeferredRange] = useState<TimeStampedPointRange | null>(null);

  // Using a deferred values enables the focus UI to update quickly,
  // and the slower operation of Suspending to load points to be deferred.
  //
  // It also allows us to update the UI slightly, before we suspend to fetch new data,
  // to indicate that what's currently being showed is stale.
  const [isTransitionPending, startTransition] = useTransition();

  const debouncedSetDeferredRange = useDebouncedCallback(
    (newRange: TimeStampedPointRange | null) => {
      startTransition(() => {
        setDeferredRange(newRange);
      });
    },
    FOCUS_DEBOUNCE_DURATION
  );

  // Refine the loaded ranges based on the focus window.
  useEffect(() => {
    if (range === null) {
      return;
    }

    const timeoutId = setTimeout(() => {
      client.loadRegion({ begin: range.begin.time, end: range.end.time }, duration);
    }, FOCUS_DEBOUNCE_DURATION);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [client, duration, range]);

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
    async (value: Range | null, debounce: boolean) => {
      let newRange: TimeStampedPointRange | null = null;
      if (value) {
        const [timeBegin, timeEnd] = value;
        const pointBegin = await imperativelyGetClosestPointForTime(client, timeBegin);
        const pointEnd = await imperativelyGetClosestPointForTime(client, timeEnd);

        newRange = {
          begin: { point: pointBegin, time: timeBegin },
          end: { point: pointEnd, time: timeEnd },
        };
      }

      setRange(newRange);

      // Focus values may change rapidly (e.g. during a click-and-drag)
      // In this case, React's default high/low priority split is helpful, but we can do more.
      // Debouncing a little before starting the transition helps avoid sending a lot of unused requests to the backend.
      if (debounce) {
        debouncedSetDeferredRange(newRange);
      } else {
        startTransition(() => {
          setDeferredRange(newRange);
        });
      }
    },
    [client, debouncedSetDeferredRange]
  );

  const focusContext = useMemo<FocusContextType>(
    () => ({
      isTransitionPending,
      rangeForDisplay: range,
      range: deferredRange,
      update: updateFocusRange,
    }),
    [deferredRange, isTransitionPending, range, updateFocusRange]
  );

  return <FocusContext.Provider value={focusContext}>{children}</FocusContext.Provider>;
}
