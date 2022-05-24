import { FC } from "react";
import { useSelector } from "react-redux";
import { getLoadedRegions } from "ui/reducers/app";
import { getFocusRegion, getZoomRegion } from "ui/reducers/timeline";
import { getVisiblePosition } from "ui/utils/timeline";
import clamp from "lodash/clamp";

export const UnloadedRegions: FC = () => {
  const loadedRegions = useSelector(getLoadedRegions);
  const zoomRegion = useSelector(getZoomRegion);
  const focusRegion = useSelector(getFocusRegion);

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
    beginTime = focusRegion.startTime;
    endTime = focusRegion.endTime;
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
