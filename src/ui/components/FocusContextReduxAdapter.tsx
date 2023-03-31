import { PropsWithChildren, useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { Range } from "replay-next/src/types";
import { enterFocusMode, setFocusRegionFromTimeRange } from "ui/actions/timeline";
import { getLoadedRegions } from "ui/reducers/app";
import { getFocusRegion } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { FocusRegion } from "ui/state/timeline";
import { rangeForFocusRegion } from "ui/utils/timeline";

// Adapter that reads focus region (from Redux) and passes it to the FocusContext.
export default function FocusContextReduxAdapter({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const loadedRegions = useAppSelector(getLoadedRegions);
  const focusRegion = useAppSelector(getFocusRegion);

  const [isPending, startTransition] = useTransition();
  const [deferredFocusRegion, setDeferredFocusRegion] = useState<FocusRegion | null>(focusRegion);

  useEffect(() => {
    startTransition(() => {
      setDeferredFocusRegion(focusRegion);
    });
  }, [focusRegion, loadedRegions]);

  const update = useCallback(
    (value: Range | null, _: boolean) => {
      dispatch(
        setFocusRegionFromTimeRange(
          value !== null
            ? {
                begin: value[0],
                end: value[1],
              }
            : null
        )
      );
    },
    [dispatch]
  );

  const context = useMemo(() => {
    return {
      enterFocusMode: () => {
        dispatch(enterFocusMode());
      },
      isTransitionPending: isPending,
      range: deferredFocusRegion ? rangeForFocusRegion(deferredFocusRegion) : null,
      rangeForDisplay: focusRegion ? rangeForFocusRegion(focusRegion) : null,
      update,
    };
  }, [deferredFocusRegion, dispatch, isPending, focusRegion, update]);

  return <FocusContext.Provider value={context}>{children}</FocusContext.Provider>;
}
