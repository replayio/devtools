import { TimeStampedPointRange } from "@replayio/protocol";
import { PropsWithChildren, useCallback, useDeferredValue, useMemo } from "react";

import { FocusContext, UpdateOptions } from "replay-next/src/contexts/FocusContext";
import { TimeRange } from "replay-next/src/types";
import {
  enterFocusMode,
  setFocusWindow,
  setFocusWindowImprecise,
  syncFocusedRegion,
  updateFocusWindowParam,
} from "ui/actions/timeline";
import { getFocusWindow } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { rangeForFocusWindow } from "ui/utils/timeline";

// Adapter that reads focus region (from Redux) and passes it to the FocusContext.
export default function FocusContextReduxAdapter({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const focusWindow = useAppSelector(getFocusWindow);

  const deferredFocusWindow = useDeferredValue(focusWindow);
  const isPending = deferredFocusWindow !== focusWindow;

  const update = useCallback(
    async (value: TimeStampedPointRange | null, options: UpdateOptions) => {
      const { sync } = options;

      await dispatch(setFocusWindow(value));

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
        setFocusWindowImprecise(
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
      range: deferredFocusWindow ? rangeForFocusWindow(deferredFocusWindow) : null,
      rangeForDisplay: focusWindow ? rangeForFocusWindow(focusWindow) : null,
      update,
      updateForTimelineImprecise,
    };
  }, [deferredFocusWindow, dispatch, isPending, focusWindow, update, updateForTimelineImprecise]);

  return <FocusContext.Provider value={context}>{children}</FocusContext.Provider>;
}
