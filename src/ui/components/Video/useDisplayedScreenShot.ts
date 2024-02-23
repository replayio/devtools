import { ScreenShot } from "@replayio/protocol";
import { useEffect, useState } from "react";

import { StreamingScreenShotCacheStatus } from "protocol/StreamingScreenShotCache";
import { getShowHoverTimeGraphics } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";

export function useDisplayedScreenShot(
  screenShot: ScreenShot | undefined,
  cacheStatus: StreamingScreenShotCacheStatus,
  time: number
) {
  const preferHoverTime = useAppSelector(getShowHoverTimeGraphics);

  const [prevScreenShotData, setPrevScreenShotData] = useState<{
    screenShot: ScreenShot | undefined;
    time: number;
  }>({
    screenShot: undefined,
    time: 0,
  });

  useEffect(() => {
    if (screenShot != null && !preferHoverTime) {
      setPrevScreenShotData({
        screenShot,
        time,
      });
    }
  }, [screenShot, preferHoverTime, time]);

  if (cacheStatus === "before-first-paint") {
    // Special case:
    // If the screenshot failed to load at a point before the first cached paint, we should show an empty screen
    return undefined;
  }

  // If we're seeking (or playing) forward, continue to show the previous screenshot
  // This prevents "flickering" while the new one loads
  return screenShot ?? prevScreenShotData.screenShot;
}
