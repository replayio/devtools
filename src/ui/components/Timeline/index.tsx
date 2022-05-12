import { mostRecentPaintOrMouseEvent } from "protocol/graphics";
import { ThreadFront } from "protocol/thread/thread";
import React, { useLayoutEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { seek, setTimelineState, setTimelineToTime } from "ui/actions/timeline";
import { selectors } from "ui/reducers";
import { getTimeFromPosition } from "ui/utils/timeline";

import Comments from "../Comments";
import CurrentTimeIndicator from "./CurrentTimeIndicator";
import ProtocolTimeline from "../ProtocolTimeline";

import { EditFocusButton } from "./EditFocusButton";
import Focuser from "./Focuser";
import FocusInputs from "./FocusInputs";
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
  const dispatch = useDispatch();
  const focusRegion = useSelector(selectors.getFocusRegion);
  const hoverTime = useSelector(selectors.getHoverTime);
  const timelineDimensions = useSelector(selectors.getTimelineDimensions);
  const zoomRegion = useSelector(selectors.getZoomRegion);

  const progressBarRef = useRef<HTMLDivElement>(null);

  const [editMode, setEditMode] = useState<EditMode | null>(null);

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

    const paintOrMouseEvent = mostRecentPaintOrMouseEvent(mouseTime);
    if (paintOrMouseEvent?.point) {
      if (!dispatch(seek(paintOrMouseEvent.point, mouseTime, false))) {
        // if seeking to the new point failed because it is in an unloaded region,
        // we reset the timeline back to the current time
        setTimelineToTime(ThreadFront.currentTime);
        setTimelineState({ currentTime: ThreadFront.currentTime });
      }
    }
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
    <div className="timeline">
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
          <CurrentTimeIndicator editMode={editMode} />
          <Focuser editMode={editMode} setEditMode={setEditMode} />
        </div>

        <Tooltip timelineWidth={timelineDimensions.width} />
      </div>

      <FocusInputs />
      <EditFocusButton />
    </div>
  );
}
