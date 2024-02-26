import { MouseEvent, useContext, useLayoutEffect } from "react";
import { useStreamingValue } from "suspense";

import { StreamingScreenShotCache } from "protocol/StreamingScreenShotCache";
import Icon from "replay-next/components/Icon";
import { LoadingProgressBar } from "replay-next/components/LoadingProgressBar";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { stopPlayback } from "ui/actions/timeline";
import CommentsOverlay from "ui/components/Comments/VideoComments";
import { NodePickerContext } from "ui/components/NodePickerContext";
import ReplayLogo from "ui/components/shared/ReplayLogo";
import ToggleButton from "ui/components/TestSuite/views/Toggle/ToggleButton";
import { subscribe } from "ui/components/Video/MutableGraphicsState";
import NodeHighlighter from "ui/components/Video/NodeHighlighter";
import { RecordedCursor } from "ui/components/Video/RecordedCursor";
import { useDisplayedScreenShot } from "ui/components/Video/useDisplayedScreenShot";
import { useImperativeVideoPlayback } from "ui/components/Video/useImperativeVideoPlayback";
import { useSmartTimeAndExecutionPoint } from "ui/components/Video/useSmartTimeAndExecutionPoint";
import { useUpdateGraphicsContext } from "ui/components/Video/useUpdateGraphicsContext";
import useVideoContextMenu from "ui/components/Video/useVideoContextMenu";
import { getSelectedPrimaryPanel } from "ui/reducers/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import styles from "./Video.module.css";

export default function Video() {
  const replayClient = useContext(ReplayClientContext);
  const { status: nodePickerStatus } = useContext(NodePickerContext);

  const dispatch = useAppDispatch();
  const panel = useAppSelector(getSelectedPrimaryPanel);

  const { executionPoint, time } = useSmartTimeAndExecutionPoint();

  const [playbackTime, onCommitCallback] = useImperativeVideoPlayback();

  const executionPointToSuspend = playbackTime != null ? null : executionPoint;
  const timeToSuspend = playbackTime != null ? playbackTime : time;

  const streaming = StreamingScreenShotCache.stream(
    replayClient,
    timeToSuspend,
    executionPointToSuspend
  );
  const {
    data: status = "fetching-cached-paint",
    progress = 0,
    value: screenShot,
  } = useStreamingValue(streaming);

  const { addComment, contextMenu, onContextMenu } = useVideoContextMenu();

  useUpdateGraphicsContext(screenShot);

  useLayoutEffect(() => {
    // When playback is active, this commit callback notifies the imperative code that a screenshot has been rendered
    // and it's okay to advance the playback timer to the next frame.
    // Without this explicit ack, the imperative playback code could advance too quickly and cause "starvation"
    // where the React scheduler didn't finish rendering a previous update before another one was requested.
    if (playbackTime != null && screenShot != null) {
      onCommitCallback(playbackTime);
    }
  }, [onCommitCallback, playbackTime, screenShot]);

  useLayoutEffect(() => {
    subscribe(state => {
      const graphicsElement = document.getElementById("graphics");
      if (graphicsElement) {
        // Scale is used by e2e tests to click on specific elements
        graphicsElement.setAttribute("data-scale", state.localScale.toString());
      }
    });
  }, []);

  const onClick = (event: MouseEvent) => {
    dispatch(stopPlayback());

    if (nodePickerStatus == "disabled") {
      addComment(event);
    }
  };

  const screenShotToRender = useDisplayedScreenShot(screenShot, status, timeToSuspend);

  const showLoader = progress < 1 && playbackTime == null;
  const showBeforeAfterTestStepToggles = panel === "cypress";

  let showError = false;
  if (status === "loading-failed") {
    showError = executionPoint != null; // !preferHoverTime && !preferPlaybackTime;
  }

  return (
    <div
      id="video"
      className={styles.Container}
      data-execution-point={executionPointToSuspend}
      data-status={status}
      data-time={timeToSuspend}
      style={{
        cursor: nodePickerStatus === "initializing" ? "progress" : undefined,
      }}
    >
      {/* Screenshots are rendered in this HTMLImageElement; if there is no screenshot to render, show the Replay logo instead */}
      {screenShotToRender ? (
        <img
          className={styles.Image}
          data-scale={1}
          id="graphics"
          onClick={onClick}
          onContextMenu={onContextMenu}
          src={`data:${screenShotToRender.mimeType};base64,${screenShotToRender.data}`}
        />
      ) : (
        <div className={styles.Logo}>
          <ReplayLogo size="sm" color="gray" />
        </div>
      )}

      {/* Graphics that are relative to the rendered screenshot go here; this container is automatically positioned to align with the screenshot */}
      <div className={styles.Graphics} id="overlay-graphics">
        <RecordedCursor time={timeToSuspend} />
        <CommentsOverlay />
        <NodeHighlighter />
      </div>

      {showLoader && <LoadingProgressBar className={styles.Loading} key={executionPoint} />}
      {showError && (
        <div className={styles.Error}>
          <Icon className={styles.ErrorIcon} type="error" />
          Could not load screenshot
        </div>
      )}
      {showBeforeAfterTestStepToggles && <ToggleButton />}
      {contextMenu}
    </div>
  );
}
