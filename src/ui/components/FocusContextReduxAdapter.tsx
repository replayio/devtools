import isEqual from "lodash/isEqual";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { FocusContext } from "bvaughn-architecture-demo/src/contexts/FocusContext";
import { Range } from "bvaughn-architecture-demo/src/types";
import { isPointInRegions, isRangeInRegions } from "shared/utils/time";
import { setFocusRegion } from "ui/actions/timeline";
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
  const prevFocusRegionRef = useRef<FocusRegion | null>(focusRegion);

  const [isPending, startTransition] = useTransition();
  const [deferredFocusRegion, setDeferredFocusRegion] = useState<FocusRegion | null>(null);

  useEffect(() => {
    let newFocusRegion = focusRegion;

    let loading = loadedRegions?.loading || null;
    let loadingBeginTime = loading?.[0]?.begin.time ?? null;
    let loadingEndTime = loading?.[0]?.end.time ?? null;

    // If we've updated loading regions, check to ensure our focus region is within the new range.
    // Sometimes it won't be, because focus is set by times (which are coarser than execution points).
    // In that case, we should shrink the (local) focus region so that it fits within the loading range.
    // Otherwise some API requests may end up hung, waiting for execution points to load that will never finish.
    if (
      loading !== null &&
      newFocusRegion !== null &&
      loadingBeginTime === newFocusRegion.beginTime &&
      loadingEndTime === newFocusRegion.endTime &&
      !isRangeInRegions(newFocusRegion, loading)
    ) {
      newFocusRegion = { ...newFocusRegion };
      if (!isPointInRegions(newFocusRegion.begin.point, loading)) {
        newFocusRegion.begin.point = loading[0].begin.point;
      }
      if (!isPointInRegions(newFocusRegion.end.point, loading)) {
        newFocusRegion.end.point = loading[0].end.point;
      }

      dispatch(
        setFocusRegion({
          beginTime: loadingBeginTime,
          endTime: loadingEndTime,
        })
      );
    }

    // If the Redux focus region has changed, mirror it in the FocusContext.
    if (!isEqual(newFocusRegion, prevFocusRegionRef.current)) {
      prevFocusRegionRef.current = newFocusRegion;
      startTransition(() => {
        setDeferredFocusRegion(newFocusRegion);
      });
    }
  }, [dispatch, focusRegion, loadedRegions]);

  const update = useCallback(
    (value: Range | null, _: boolean) => {
      dispatch(
        setFocusRegion(
          value !== null
            ? {
                beginTime: value[0],
                endTime: value[1],
              }
            : null
        )
      );
    },
    [dispatch]
  );

  const context = useMemo(() => {
    return {
      isTransitionPending: isPending,
      range: deferredFocusRegion ? rangeForFocusRegion(deferredFocusRegion) : null,
      rangeForDisplay: focusRegion ? rangeForFocusRegion(focusRegion) : null,
      update,
    };
  }, [deferredFocusRegion, isPending, focusRegion, update]);

  return <FocusContext.Provider value={context}>{children}</FocusContext.Provider>;
}
