import clamp from "lodash/clamp";

import useLoadedRegions from "replay-next/src/hooks/useLoadedRegions";
import { getZoomRegion } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";

import styles from "./LoadingProgressBars.module.css";

export default function LoadingProgressBars() {
  const loadedRegions = useLoadedRegions();
  const zoomRegion = useAppSelector(getZoomRegion);

  const endTime = zoomRegion ? zoomRegion.endTime : 0;
  if (endTime === 0) {
    return null;
  }

  const completedRegions = loadedRegions ? loadedRegions.indexed : [];
  const loadingRegions = loadedRegions ? loadedRegions.loading : [];

  return (
    <>
      {loadingRegions.map(({ begin, end }, index) => (
        <div
          key={`loading-${index}`}
          className={styles.LoadingRegion}
          style={{
            left: `${(begin.time / endTime) * 100}%`,
            width: `${clamp(((end.time - begin.time) / endTime) * 100, 0, 100)}%`,
          }}
        />
      ))}
      {completedRegions.map(({ begin, end }, index) => (
        <div
          key={`loaded-${index}`}
          className={styles.IndexedAndLoadedRegion}
          style={{
            left: `${(begin.time / endTime) * 100}%`,
            width: `${clamp(((end.time - begin.time) / endTime) * 100, 0, 100)}%`,
          }}
        />
      ))}
    </>
  );
}
