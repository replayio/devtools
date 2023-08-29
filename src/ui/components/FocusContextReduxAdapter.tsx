import { TimeStampedPointRange } from "@replayio/protocol";
import { PropsWithChildren, useCallback, useDeferredValue, useMemo } from "react";

import { FocusContext, UpdateOptions } from "replay-next/src/contexts/FocusContext";
import { useCurrentFocusWindow } from "replay-next/src/hooks/useCurrentFocusWindow";
import { TimeRange } from "replay-next/src/types";
import {
  enterFocusMode,
  setFocusWindow as setDisplayedRange,
  setFocusWindowImprecise as setDisplayedRangeImprecise,
  syncFocusedRegion,
  updateFocusWindowParam,
} from "ui/actions/timeline";
import { getFocusWindow } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

// Adapter that reads focus region (from Redux) and passes it to the FocusContext.
export default function FocusContextReduxAdapter({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const range = useCurrentFocusWindow();
  const rangeForDisplay = useAppSelector(getFocusWindow);

  const rangeForSuspense = useDeferredValue(range);
  const isPending = rangeForSuspense !== range;

  const update = useCallback(
    async (value: TimeStampedPointRange | null, options: UpdateOptions) => {
      const { sync } = options;

      await dispatch(setDisplayedRange(value));

      if (sync) {
        await dispatch(syncFocusedRegion());
        dispatch(updateFocusWindowParam());
      }
    },
    [dispatch]
  );

  const updateForTimelineImprecise = useCallback(
    async (value: TimeRange | null, options: UpdateOptions) => {
      const { sync } = options;

      await dispatch(
        setDisplayedRangeImprecise(
          value !== null
            ? {
                begin: value[0],
                end: value[1],
              }
            : null
        )
      );

      if (sync) {
        await dispatch(syncFocusedRegion());
        dispatch(updateFocusWindowParam());
      }
    },
    [dispatch]
  );

  const context = useMemo(() => {
    return {
      enterFocusMode: () => {
        dispatch(enterFocusMode());
      },
      isTransitionPending: isPending,
      range,
      rangeForDisplay,
      rangeForSuspense,
      update,
      updateForTimelineImprecise,
    };
  }, [
    dispatch,
    isPending,
    range,
    rangeForDisplay,
    rangeForSuspense,
    update,
    updateForTimelineImprecise,
  ]);

  return <FocusContext.Provider value={context}>{children}</FocusContext.Provider>;
}
