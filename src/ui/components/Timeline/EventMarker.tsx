import React from "react";

import { selectors } from "ui/reducers";
import { useAppSelector } from "ui/setup/hooks";
import { ReplayEvent } from "ui/state/app";
import { getVisiblePosition } from "ui/utils/timeline";

import styles from "./EventMarker.module.css";

export default function EventMarker({ event }: { event: ReplayEvent }) {
  const { time } = event;

  const zoomRegion = useAppSelector(selectors.getZoomRegion);

  const offsetPercent = getVisiblePosition({ time, zoom: zoomRegion }) * 100;
  if (offsetPercent < 0 || offsetPercent > 100) {
    return null;
  }

  return (
    <div
      className={styles.EventMarker}
      style={{
        left: `${offsetPercent}%`,
      }}
    />
  );
}
