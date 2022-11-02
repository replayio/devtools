import { TimeStampedPointRange } from "@replayio/protocol";
import clamp from "lodash/clamp";
import { FC } from "react";

import { getLoadedRegions } from "ui/reducers/app";
import { getFocusRegion, getZoomRegion } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";
import { getVisiblePosition, overlap } from "ui/utils/timeline";

export const UnloadedRegions: FC = () => {
  const loadedRegions = useAppSelector(getLoadedRegions);
  const zoomRegion = useAppSelector(getZoomRegion);
  const focusRegion = useAppSelector(getFocusRegion);

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
  if (focusRegion) {
    // Even though we technically focus on the nearest points,
    // We should only show the user a range defining their specified times.
    const userVisibleTimeStampedPointRange: TimeStampedPointRange = {
      begin: {
        point: focusRegion.begin.point,
        time: focusRegion.beginTime,
      },
      end: {
        point: focusRegion.end.point,
        time: focusRegion.endTime,
      },
    };

    const overlappingRegions = overlap([userVisibleTimeStampedPointRange], loadedRegions.loading);
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
