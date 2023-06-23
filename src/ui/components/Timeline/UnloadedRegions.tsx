import { TimeStampedPointRange } from "@replayio/protocol";
import clamp from "lodash/clamp";
import { FC } from "react";

import useLoadedRegions from "replay-next/src/hooks/useLoadedRegions";
import { getFocusWindow, getZoomRegion } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";
import { getVisiblePosition, overlap } from "ui/utils/timeline";

export const UnloadedRegions: FC = () => {
  const loadedRegions = useLoadedRegions();
  const zoomRegion = useAppSelector(getZoomRegion);
  const focusWindow = useAppSelector(getFocusWindow);

  // Check loadedRegions to keep typescript happy.
  if (!loadedRegions) {
    return null;
  }

  // An empty loadedRegions array after we've finished loading regions means that
  // the whole recording has been unloaded.
  if (loadedRegions.loaded.length === 0) {
    return <div className="unloaded-regions w-full" />;
  }

  const { begin, end } = loadedRegions.loaded[0];
  let beginTime = begin.time;
  let endTime = end.time;
  if (focusWindow) {
    const overlappingRegions = overlap([focusWindow], loadedRegions.loading);
    if (overlappingRegions.length > 0) {
      const focusedAndLoaded = overlappingRegions[0];
      beginTime = focusedAndLoaded.begin.time;
      endTime = focusedAndLoaded.end.time;
    }
  }
  const { endTime: recordingEndTime } = zoomRegion;
  const loadedRegionStart = getVisiblePosition({ time: beginTime, zoom: zoomRegion }) * 100;
  const loadedRegionEnd =
    getVisiblePosition({ time: recordingEndTime - endTime, zoom: zoomRegion }) * 100;

  return (
    <>
      <div
        className="unloaded-regions start"
        style={{ width: `${clamp(loadedRegionStart, 0, 100)}%` }}
      />
      <div
        className="unloaded-regions end"
        style={{ width: `${clamp(loadedRegionEnd, 0, 100)}%` }}
      />
    </>
  );
};
