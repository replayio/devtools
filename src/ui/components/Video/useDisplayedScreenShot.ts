import { ScreenShot } from "@replayio/protocol";
import { useEffect, useState } from "react";

import { getShowHoverTimeGraphics } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";

export function useDisplayedScreenShot(screenShot: ScreenShot | undefined, time: number) {
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

  let screenShotToRender = screenShot;
  if (screenShotToRender == null && time >= prevScreenShotData.time) {
    // If we're seeking (or playing) forward, continue to show the previous screenshot
    // This prevents "flickering" while the new one loads
    // It doesn't make sense to do this when seeking backwards though
    screenShotToRender = prevScreenShotData.screenShot;
  }

  return screenShotToRender;
}
