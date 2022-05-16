import { clamp } from "lodash";
import { useSelector } from "react-redux";
import { getLoadedRegions } from "ui/reducers/app";
import { getZoomRegion } from "ui/reducers/timeline";
import { overlap } from "ui/utils/timeline";

import styles from "./LoadingProgressBars.module.css";

export default function LoadingProgressBars() {
  const loadedRegions = useSelector(getLoadedRegions);
  const zoomRegion = useSelector(getZoomRegion);

  const regions = loadedRegions ? overlap(loadedRegions.indexed, loadedRegions.loaded) : [];
  const endTime = zoomRegion ? zoomRegion.endTime : 0;

  return regions.map(({ begin, end }, index) => (
    <div
      key={index}
      className={styles.Region}
      style={{
        left: `${(begin.time / endTime) * 100}%`,
        width: `${clamp(((end.time - begin.time) / endTime) * 100, 0, 100)}%`,
      }}
    />
  )) as any;
}
