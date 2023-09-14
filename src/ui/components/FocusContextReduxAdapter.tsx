import { TimeStampedPointRange } from "@replayio/protocol";
import { PropsWithChildren, useCallback, useContext, useDeferredValue, useMemo } from "react";

import { FocusContext, UpdateOptions } from "replay-next/src/contexts/FocusContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { useCurrentFocusWindow } from "replay-next/src/hooks/useCurrentFocusWindow";
import { TimeRange } from "replay-next/src/types";
import { enterFocusMode, requestFocusWindow, setDisplayedFocusWindow } from "ui/actions/timeline";
import { getFocusWindow } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

// Adapter that reads focus region (from Redux) and passes it to the FocusContext.
export default function FocusContextReduxAdapter({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const { duration } = useContext(SessionContext);
  const range = useCurrentFocusWindow();
  const rangeForDisplay = useAppSelector(getFocusWindow);

  const rangeForSuspense = useDeferredValue(range);
  const isPending = rangeForSuspense !== range;

  const update = useCallback(
    async (value: TimeStampedPointRange, options: UpdateOptions) => {
      const { sync } = options;
      if (sync) {
        await dispatch(requestFocusWindow(value));
      } else {
        await dispatch(
          setDisplayedFocusWindow(value ? { begin: value.begin.time, end: value.end.time } : null)
        );
      }
    },
    [dispatch]
  );

  const updateForTimelineImprecise = useCallback(
    async (value: TimeRange | null, options: UpdateOptions) => {
      const { sync } = options;
      if (sync) {
        const beginTime = value ? value[0] : 0;
        const endTime = value ? value[1] : duration;
        await dispatch(requestFocusWindow({ begin: { time: beginTime }, end: { time: endTime } }));
      } else {
        await dispatch(setDisplayedFocusWindow(value ? { begin: value[0], end: value[1] } : null));
      }
    },
    [dispatch, duration]
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
