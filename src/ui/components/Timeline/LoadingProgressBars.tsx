import { clamp } from "lodash";
import { useSelector } from "react-redux";
import { getLoadedRegions } from "ui/reducers/app";
import { getZoomRegion } from "ui/reducers/timeline";
import { overlap } from "ui/utils/timeline";

import styles from "./LoadingProgressBars.module.css";

export default function LoadingProgressBars() {
  const loadedRegions = useSelector(getLoadedRegions);
  const zoomRegion = useSelector(getZoomRegion);

  const allRegions = loadedRegions ? loadedRegions.loading : [];
  const completeRegions = loadedRegions ? overlap(loadedRegions.indexed, loadedRegions.loaded) : [];
  const endTime = zoomRegion ? zoomRegion.endTime : 0;

  return (
    <>
      {allRegions.map(({ begin, end }, index) => (
        <div
          key={`loading-${index}`}
          className={styles.LoadingRegion}
          style={{
            left: `${(begin.time / endTime) * 100}%`,
            width: `${clamp(((end.time - begin.time) / endTime) * 100, 0, 100)}%`,
          }}
        />
      ))}
      {completeRegions.map(({ begin, end }, index) => (
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
