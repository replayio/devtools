import { clamp } from "lodash";
import React, { useLayoutEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setTimelineState, setTimelineToTime } from "ui/actions/timeline";
import { selectors } from "ui/reducers";
import { ZoomRegion } from "ui/state/timeline";
import { getFormattedTime, getVisiblePosition } from "ui/utils/timeline";

import Comments from "../Comments";
import ProtocolTimeline from "../ProtocolTimeline";

import { EditFocusButton } from "./EditFocusButton";
import Focuser from "./Focuser";
import NonLoadingRegions from "./NonLoadingRegions";
import PlayPauseButton from "./PlaybackControls";
import PreviewMarkers from "./PreviewMarkers";
import ProgressBars from "./ProgressBars";
import Tooltip from "./Tooltip";
import UnfocusedRegion from "./UnfocusedRegion";

export default function Timeline() {
  const dispatch = useDispatch();
  const currentTime = useSelector(selectors.getCurrentTime);
  const focusRegion = useSelector(selectors.getFocusRegion);
  const hoverTime = useSelector(selectors.getHoverTime);
  const recordingDuration = useSelector(selectors.getRecordingDuration);
  const timelineDimensions = useSelector(selectors.getTimelineDimensions);
  const zoomRegion = useSelector(selectors.getZoomRegion);

  const timelineRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const percent = getVisiblePosition({ time: currentTime, zoom: zoomRegion }) * 100;
  const formattedTime = getFormattedTime(currentTime);

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

  const onClick = (event: React.MouseEvent) => {
    const mouseTime = getTimeFromPosition(event.pageX, progressBarRef.current!, zoomRegion);
    const isOutsideFocusRegion =
      focusRegion && (mouseTime < focusRegion.startTime || mouseTime > focusRegion.endTime);

    if (isOutsideFocusRegion) {
      return;
    }

    dispatch(setTimelineToTime(mouseTime, true));
    dispatch(setTimelineState({ currentTime: mouseTime }));
  };

  const onMouseMove = (event: React.MouseEvent) => {
    const mouseTime = getTimeFromPosition(event.pageX, progressBarRef.current!, zoomRegion);
    const isDragging = event.buttons === 1;
    const isOutsideFocusRegion =
      focusRegion && (mouseTime < focusRegion.startTime || mouseTime > focusRegion.endTime);

    if (isOutsideFocusRegion) {
      return;
    }

    if (hoverTime != mouseTime) {
      dispatch(setTimelineToTime(mouseTime, isDragging));
    }

    if (isDragging) {
      dispatch(setTimelineState({ currentTime: mouseTime }));
    }
  };

  return (
    <div className="timeline" ref={timelineRef}>
      <div className="commands">
        <PlayPauseButton />
      </div>

      <div className="progress-bar-container">
        <div
          className="progress-bar"
          ref={progressBarRef}
          onClick={onClick}
          onMouseMove={onMouseMove}
        >
          <ProtocolTimeline />
          <ProgressBars />
          <PreviewMarkers />
          <Comments />
          <NonLoadingRegions />
          <UnfocusedRegion />
          <div className="progress-line-paused" style={{ left: `${percent}%` }} />
          <Focuser timelineRef={timelineRef} />
        </div>

        <Tooltip timelineWidth={timelineDimensions.width} />
      </div>

      {/* TODO [bvaughn] Wrap this UI up in a component */}
      <div
        className="timeline-time text-right"
        style={{ minWidth: `${formattedTime.length * 2 + 2}ch` }}
      >
        <span className="time-current">{formattedTime}</span>
        <span className="time-divider">/</span>
        <span className="time-total">{getFormattedTime(recordingDuration || 0)}</span>
      </div>
      <EditFocusButton />
    </div>
  );
}

// TODO [bvaughn] Don't repeat this code with Focuser
const getTimeFromPosition = (pageX: number, target: HTMLElement, zoomRegion: ZoomRegion) => {
  const rect = target.getBoundingClientRect();
  const x = pageX - rect.left;
  const zoomRegionDuration = zoomRegion.endTime - zoomRegion.startTime;
  const time = zoomRegion.startTime + clamp(x / rect.width, 0, 100) * zoomRegionDuration;
  return time;
};
