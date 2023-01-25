import { MouseEvent, useLayoutEffect, useRef, useState } from "react";

import { seekToTime, setTimelineToTime, stopPlayback } from "ui/actions/timeline";
import { selectors } from "ui/reducers";
import {
  isPlaying as isPlayingSelector,
  setDragging,
  setTimelineState,
} from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
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

  const progressBarRef = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [resumePlaybackOnMouseUp, setResumePlaybackOnMouseUp] = useState<boolean>(false);

  const [editMode, setEditMode] = useState<EditMode | null>(null);
  const [showLoadingProgress, setShowLoadingProgress] = useState<boolean>(false);

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

    const mouseTime = getTimeFromPosition(
      event.pageX,
      progressBarRef.current!.getBoundingClientRect(),
      zoomRegion
    );

    dispatch(setTimelineState({ currentTime: mouseTime }));
    dispatch(setTimelineToTime(mouseTime, true));
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
      dispatch(setTimelineToTime(mouseTime, isDragging));
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

    dispatch(setDragging(false));
    dispatch(seekToTime(mouseTime, resumePlaybackOnMouseUp));

    if (resumePlaybackOnMouseUp) {
      setResumePlaybackOnMouseUp(false);
    }
  };

  const onMouseLeave = () => {
    setIsHovered(false);
    dispatch(setTimelineToTime(null, false));
  };

  return (
    <>
      <FocusModePopout />
      <div className="timeline">
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
          <div className="progress-bar-stack">
            <ProtocolTimeline />
            <div className="progress-bar" ref={progressBarRef}>
              <ProgressBars />
              <PreviewMarkers />
              <Comments />
              <NonLoadingRegions />
              <UnfocusedRegion />
              {showLoadingProgress && <LoadingProgressBars />}
              <CurrentTimeIndicator editMode={editMode} />
              <Focuser editMode={editMode} setEditMode={setEditMode} />
            </div>
          </div>

          {isHovered && <Tooltip timelineWidth={timelineDimensions.width} />}
        </div>

        <Capsule setShowLoadingProgress={setShowLoadingProgress} />
      </div>
    </>
  );
}
