import { FC } from "react";
import { useSelector } from "react-redux";
import { getLoadedRegions } from "ui/reducers/app";
import { getZoomRegion } from "ui/reducers/timeline";
import { getVisiblePosition } from "ui/utils/timeline";
import clamp from "lodash/clamp";

export const UnloadedRegions: FC = () => {
  const loadedRegions = useSelector(getLoadedRegions);
  const zoomRegion = useSelector(getZoomRegion);

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
  const { endTime } = zoomRegion;
  const loadedRegionStart = getVisiblePosition({ time: begin.time, zoom: zoomRegion }) * 100;
  const loadedRegionEnd = getVisiblePosition({ time: endTime - end.time, zoom: zoomRegion }) * 100;

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
