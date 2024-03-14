import { MouseEvent, Suspense, useContext, useLayoutEffect, useRef, useState } from "react";

import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";
import { throttle } from "shared/utils/function";
import { seek, setDisplayedFocusWindow, setHoverTime, stopPlayback } from "ui/actions/timeline";
import useTimelineContextMenu from "ui/components/Timeline/useTimelineContextMenu";
import { selectors } from "ui/reducers";
import {
  isPlaying as isPlayingSelector,
  setDragging,
  setTimelineState,
} from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { AppDispatch } from "ui/setup/store";
import { getTimeFromPosition } from "ui/utils/timeline";

import Comments from "../Comments";
import ProtocolTimeline from "../ProtocolTimeline";
import Capsule from "./Capsule";
import CurrentTimeIndicator from "./CurrentTimeIndicator";
import Focuser from "./Focuser";
import FocusModePopout from "./FocusModePopout";
import LoadingProgressBars from "./LoadingProgressBars";
import NonLoadingRegions from "./NonLoadingRegions";
import PlayPauseButton from "./PlaybackControls";
import PreviewMarkers from "./PreviewMarkers";
import ProgressBars from "./ProgressBars";
import Tooltip from "./Tooltip";
import UnfocusedRegion from "./UnfocusedRegion";

export type EditMode = {
  dragOffset?: number;
  type: "drag" | "resize-end" | "resize-start";
};

export default function Timeline() {
  const dispatch = useAppDispatch();
  const hoverTime = useAppSelector(selectors.getHoverTime);
  const timelineDimensions = useAppSelector(selectors.getTimelineDimensions);
  const zoomRegion = useAppSelector(selectors.getZoomRegion);
  const isPlaying = useAppSelector(isPlayingSelector);

  const [showProtocolTimeline] = useGraphQLUserData("feature_protocolTimeline");

  const { rangeForDisplay } = useContext(FocusContext);

  const progressBarRef = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [resumePlaybackOnMouseUp, setResumePlaybackOnMouseUp] = useState<boolean>(false);

  const [editMode, setEditMode] = useState<EditMode | null>(null);
  const [showLoadingProgress, setShowLoadingProgress] = useState<boolean>(false);

  const { contextMenu, onContextMenu } = useTimelineContextMenu();

  useLayoutEffect(() => {
    const progressBar = progressBarRef.current;

    const onWindowResize = () => {
      const rect = progressBar!.getBoundingClientRect();
      dispatch(
        setTimelineState({
          timelineDimensions: { width: rect.width, left: rect.left, top: rect.top },
        })
      );
    };

    // Set initial dimensions on-mount
    onWindowResize();

    // Update dimensions when the browser resizes
    window.addEventListener("resize", onWindowResize);
    return () => {
      window.removeEventListener("resize", onWindowResize);
    };
  }, [dispatch]);

  const onMouseDown = (event: MouseEvent) => {
    if (isPlaying) {
      setResumePlaybackOnMouseUp(true);
      dispatch(stopPlayback(false));
    }
  };

  const onMouseMove = (event: MouseEvent) => {
    const mouseTime = getTimeFromPosition(
      event.pageX,
      progressBarRef.current!.getBoundingClientRect(),
      zoomRegion
    );
    const isDragging = event.buttons === 1;

    dispatch(setDragging(isDragging));

    if (hoverTime != mouseTime) {
      dispatch(setHoverTime(mouseTime, isDragging));
    }

    if (isDragging) {
      dispatch(setTimelineState({ currentTime: mouseTime }));
    }
  };

  const onMouseUp = (event: MouseEvent) => {
    const mouseTime = getTimeFromPosition(
      event.pageX,
      progressBarRef.current!.getBoundingClientRect(),
      zoomRegion
    );

    if (!editMode) {
      // If we're editing focus mode, don't update the current time marker.
      dispatch(seek({ autoPlay: resumePlaybackOnMouseUp, time: mouseTime }));
    }

    dispatch(setDragging(false));

    if (resumePlaybackOnMouseUp) {
      setResumePlaybackOnMouseUp(false);
    }
  };

  const onMouseLeave = () => {
    setIsHovered(false);
    dispatch(setHoverTime(null, false));
  };

  return (
    <>
      <FocusModePopout updateFocusWindowThrottled={updateFocusWindowThrottled} />
      <div
        className="timeline"
        data-protocol-timeline-enabled={showProtocolTimeline || undefined}
        data-test-id="Timeline"
        data-test-focus-begin-time={rangeForDisplay?.begin}
        data-test-focus-end-time={rangeForDisplay?.end}
      >
        <div className="commands">
          <PlayPauseButton />
        </div>

        <div
          className="progress-bar-container"
          onMouseDown={onMouseDown}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={onMouseLeave}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
        >
          <div className="progress-bar-stack" onContextMenu={onContextMenu}>
            {showProtocolTimeline && (
              <Suspense>
                <ProtocolTimeline />
              </Suspense>
            )}
            <div className="progress-bar" data-test-id="Timeline-ProgressBar" ref={progressBarRef}>
              <ProgressBars />
              <PreviewMarkers />
              <div className="comments-container">
                <Comments />
                <CurrentTimeIndicator editMode={editMode} />
              </div>
              <NonLoadingRegions />
              <UnfocusedRegion />
              {showLoadingProgress && <LoadingProgressBars />}
              <Focuser
                editMode={editMode}
                setEditMode={setEditMode}
                updateFocusWindowThrottled={updateFocusWindowThrottled}
              />
            </div>
          </div>

          {isHovered && <Tooltip timelineWidth={timelineDimensions.width} />}
        </div>

        <Capsule setShowLoadingProgress={setShowLoadingProgress} />
      </div>
      {contextMenu}
    </>
  );
}

const updateFocusWindowThrottled = throttle((dispatch: AppDispatch, begin: number, end: number) => {
  return dispatch(setDisplayedFocusWindow({ begin, end }));
}, 250);
