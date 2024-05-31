import { MouseEvent, useContext, useLayoutEffect, useState } from "react";

import Icon from "replay-next/components/Icon";
import { LoadingProgressBar } from "replay-next/components/LoadingProgressBar";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { stopPlayback } from "ui/actions/timeline";
import CommentsOverlay from "ui/components/Comments/VideoComments";
import { NodePickerContext } from "ui/components/NodePickerContext";
import ReplayLogo from "ui/components/shared/ReplayLogo";
import ToggleButton from "ui/components/TestSuite/views/Toggle/ToggleButton";
import { State, state } from "ui/components/Video/imperative/MutableGraphicsState";
import { subscribeToMutableSources } from "ui/components/Video/imperative/subscribeToMutableSources";
import NodeHighlighter from "ui/components/Video/NodeHighlighter";
import { RecordedCursor } from "ui/components/Video/RecordedCursor";
import useVideoContextMenu from "ui/components/Video/useVideoContextMenu";
import { getSelectedPrimaryPanel } from "ui/reducers/layout";
import { useAppDispatch, useAppSelector, useAppStore } from "ui/setup/hooks";

import styles from "./Video.module.css";

const SHOW_LOADING_INDICATOR_AFTER_MS = 1_500;

export default function Video() {
  const reduxStore = useAppStore();
  const replayClient = useContext(ReplayClientContext);

  const { status: nodePickerStatus } = useContext(NodePickerContext);

  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const [showError, setShowError] = useState(false);

  useLayoutEffect(() => {
    const containerElement = document.getElementById("video") as HTMLDivElement;
    const graphicsElement = document.getElementById("graphics") as HTMLImageElement;
    const graphicsOverlayElement = document.getElementById("overlay-graphics") as HTMLDivElement;

    let prevState: Partial<State> = {};
    let stalledTimeout: NodeJS.Timeout | null = null;

    // Keep graphics in sync with the imperatively managed screenshot state
    state.listen(nextState => {
      if (nextState.screenShot != prevState.screenShot) {
        const { screenShot } = nextState;
        if (screenShot) {
          graphicsElement.src = `data:${screenShot.mimeType};base64,${screenShot.data}`;
        } else {
          graphicsElement.src = "";
        }
      }

      // Show loading progress bar if graphics stall for longer than 5s
      const isLoading = nextState.status === "loading";
      const wasLoading = prevState.status === "loading";
      if (isLoading && !wasLoading) {
        stalledTimeout = setTimeout(() => {
          setShowLoadingIndicator(true);
        }, SHOW_LOADING_INDICATOR_AFTER_MS);
      } else if (!isLoading && wasLoading) {
        if (stalledTimeout != null) {
          clearTimeout(stalledTimeout);
        }

        setShowLoadingIndicator(false);
      }

      if (nextState.status === "failed") {
        setShowError(true);
      } else {
        setShowError(false);
      }

      // The data attributes are sed for e2e tests
      containerElement.setAttribute("data-execution-point", nextState.currentExecutionPoint ?? "");
      containerElement.setAttribute("data-screenshot-type", "" + nextState.screenShotType);
      containerElement.setAttribute("data-status", "" + nextState.status);
      containerElement.setAttribute("data-time", "" + nextState.currentTime);
      graphicsElement.setAttribute("data-local-scale", nextState.localScale.toString());
      graphicsElement.setAttribute("data-recording-scale", nextState.recordingScale.toString());

      Object.assign(prevState, nextState);
    });

    const unsubscribe = subscribeToMutableSources({
      containerElement,
      graphicsElement,
      graphicsOverlayElement,
      reduxStore,
      replayClient,
    });

    return () => {
      unsubscribe();

      if (stalledTimeout != null) {
        clearTimeout(stalledTimeout);
      }
    };
  }, [reduxStore, replayClient]);

  const dispatch = useAppDispatch();
  const panel = useAppSelector(getSelectedPrimaryPanel);

  const { contextMenu, onContextMenu: onClick } = useVideoContextMenu();

  const showBeforeAfterTestStepToggles = panel === "cypress";

  return (
    <div
      id="video"
      className={styles.Container}
      style={{
        cursor: nodePickerStatus === "initializing" ? "progress" : undefined,
      }}
    >
      <div className={styles.Logo}>
        <ReplayLogo size="sm" color="gray" />
      </div>

      <img className={styles.Image} id="graphics" onClick={onClick} />

      {/* Graphics that are relative to the rendered screenshot go here; this container is automatically positioned to align with the screenshot */}
      <div className={styles.Graphics} id="overlay-graphics">
        <RecordedCursor />
        <CommentsOverlay />
        <NodeHighlighter />
      </div>

      {showLoadingIndicator && <LoadingProgressBar className={styles.Loading} />}

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
