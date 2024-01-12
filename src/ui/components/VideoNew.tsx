import { ScreenShot } from "@replayio/protocol";
import { MouseEvent, useContext, useEffect, useState } from "react";
import { useStreamingValue } from "suspense";

import { getExecutionPoint, getTime } from "devtools/client/debugger/src/selectors";
import Icon from "replay-next/components/Icon";
import { LoadingProgressBar } from "replay-next/components/LoadingProgressBar";
import { StreamingScreenShotCache } from "replay-next/src/suspense/GraphicsCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { getHoverTime, getShowHoverTimeGraphics } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";

import ReplayLogo from "./shared/ReplayLogo";
import styles from "./VideoNew.module.css";

// There are two scenarios we need to fetch graphics for:
// (1) The current execution point has changed (e.g. the timeline has changed)
// (2) The user is hovering over something (like a test step)
//
// In both cases, it should show the previous screenshot until a newer one has been fetched.
// This prevents flickering as data is being fetched.
//
// In the first case, if screenshot loading fails, we should show an explicit error.
//
// In the second case, we should fail quietly if there is no screenshot available.
// In that event the previous graphics (for the current execution point) will remain visible.
export default function Video() {
  const replayClient = useContext(ReplayClientContext);

  const currentTime = useAppSelector(getTime);
  const currentExecutionPoint = useAppSelector(getExecutionPoint);
  const hoverTime = useAppSelector(getHoverTime);
  const showHoverTimeGraphics = useAppSelector(getShowHoverTimeGraphics);

  // TODO [FE-2104] I think this breaks playback; I guess we don't unsuspend and commit in time?

  const time = hoverTime != null && showHoverTimeGraphics ? hoverTime : currentTime;
  const executionPoint = showHoverTimeGraphics ? null : currentExecutionPoint;

  const streaming = StreamingScreenShotCache.stream(replayClient, time, executionPoint);
  const { data: status, progress = 0, value: screenShot } = useStreamingValue(streaming);

  const [prevScreenShot, setPrevScreenShot] = useState<ScreenShot | undefined>(undefined);
  useEffect(() => {
    if (executionPoint != null && screenShot != null) {
      setPrevScreenShot(screenShot);
    }
  }, [executionPoint, screenShot]);

  const onClick = (event: MouseEvent) => {
    // TODO [FE-2104] Handle event
  };

  const onContextMenu = (event: MouseEvent) => {
    // TODO [FE-2104] Handle event
  };

  const screenShotToRender = screenShot ?? prevScreenShot;
  const showError = status === "loading-failed" && executionPoint != null;

  return (
    <div id="video" className={styles.Container}>
      <div className={styles.Logo}>
        <ReplayLogo size="sm" color="gray" />
      </div>

      {/* TODO [FE-2104] Remove this once references to it are gone */}
      <canvas id="graphics" />

      {screenShotToRender && (
        <img
          className={styles.Image}
          src={`data:${screenShotToRender.mimeType};base64,${screenShotToRender.data}`}
          onClick={onClick}
          onContextMenu={onContextMenu}
        />
      )}

      {/* TODO [FE-2104] Add comment overlay */}
      {/* TODO [FE-2104] Add DOM element highlight overlay */}

      {progress < 1 && <LoadingProgressBar className={styles.Loading} key={executionPoint} />}
      {showError && (
        <div className={styles.Error} title="Could not load screenshot">
          <Icon className={styles.ErrorIcon} type="error" />
        </div>
      )}
    </div>
  );
}
