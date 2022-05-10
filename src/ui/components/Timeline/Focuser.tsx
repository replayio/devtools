import clamp from "lodash/clamp";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFocusRegion } from "ui/actions/timeline";
import { selectors } from "ui/reducers";
import { getPositionFromTime, getTimeFromPosition } from "ui/utils/timeline";

type EditMode = {
  dragOffset?: number;
  type: "move" | "move-auto" | "resize-end" | "resize-start";
};

type Props = { timelineRef: React.RefObject<HTMLDivElement> };

// HACK: Limit the smallest focus region to be ~10% of the duration;
// This avoids some known selection UI bugs.
const MIN_FOCUS_WINDOW_PERCENTAGE = 0.1;

function stopEvent(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

export default function ConditionalFocuser({ timelineRef }: Props) {
  const focusRegion = useSelector(selectors.getFocusRegion);
  const isFocusing = useSelector(selectors.getIsFocusing);

  if (!focusRegion || !isFocusing) {
    return null;
  }

  return <Focuser timelineRef={timelineRef} />;
}

function Focuser({ timelineRef }: Props) {
  const dispatch = useDispatch();
  const zoomRegion = useSelector(selectors.getZoomRegion);
  const focusRegion = useSelector(selectors.getFocusRegion);
  const prevFocusRegion = useSelector(selectors.getPrevFocusRegion);

  // The first time we place a focus mode, it should automatically move to track the cursor.
  // If we're editing an existing focus mode, it should not.
  const [editMode, setEditMode] = useState<EditMode | null>(
    prevFocusRegion === null ? { type: "move-auto" } : null
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const draggableAreaRef = useRef<HTMLDivElement>(null);
  const didDragRef = useRef<boolean>(false);

  useEffect(() => {
    const div = containerRef.current;
    const timeline = timelineRef.current;

    if (!div || !focusRegion || !editMode || !timeline) {
      return;
    }

    // Stop auto-tracking on "click"
    const onTimelineClick = (event: MouseEvent) => {
      if (editMode.type === "move-auto") {
        // This click shouldn't bubble; we're handling
        stopEvent(event);

        setEditMode(null);
      }
    };

    // Stop dragging on "click"
    const onWindowClick = (event: MouseEvent) => {
      switch (editMode.type) {
        case "move":
        case "resize-end":
        case "resize-start": {
          // If this was a real click, we should allow this event to pass through to update the current time.
          // If it is part of a drag operation, we shouldn't.
          if (didDragRef.current) {
            stopEvent(event);

            didDragRef.current = false;
          }

          setEditMode(null);
          break;
        }
      }
    };

    const onWindowMouseMove = (event: MouseEvent) => {
      stopEvent(event);

      const { movementX, pageX } = event;
      if (movementX !== 0) {
        didDragRef.current = true;

        const relativeMouseX = pageX - (editMode.dragOffset || 0);
        const mouseTime = getTimeFromPosition(relativeMouseX, div, zoomRegion);

        switch (editMode.type) {
          case "move":
          case "move-auto": {
            // Re-center the focus region around the mouse cursor.
            const focusRegionDuration = focusRegion.endTime - focusRegion.startTime;
            let newEndTime = mouseTime + focusRegionDuration / 2;
            let newStartTime = mouseTime - focusRegionDuration / 2;

            // Make sure the new focus region is still within our zoom bounds.
            if (newStartTime < zoomRegion.startTime) {
              newEndTime += zoomRegion.startTime - newStartTime;
              newStartTime = zoomRegion.startTime;
            } else if (newEndTime > zoomRegion.endTime) {
              newStartTime -= newEndTime - zoomRegion.endTime;
              newEndTime = zoomRegion.endTime;
            }

            dispatch(
              setFocusRegion({
                endTime: newEndTime,
                startTime: newStartTime,
              })
            );
            break;
          }
          case "resize-end": {
            const zoomRegionDuration = zoomRegion.endTime - zoomRegion.startTime;
            // TODO [bvaughn] Move minDuration checking into action dispatcher to be shared (and tested).
            const minDuration = zoomRegionDuration * MIN_FOCUS_WINDOW_PERCENTAGE;
            const endTime = Math.max(mouseTime, focusRegion.startTime + minDuration);
            dispatch(
              setFocusRegion({
                endTime,
                startTime: focusRegion.startTime,
              })
            );
            break;
          }
          case "resize-start": {
            const zoomRegionDuration = zoomRegion.endTime - zoomRegion.startTime;
            // TODO [bvaughn] Move minDuration checking into action dispatcher to be shared (and tested).
            const minDuration = zoomRegionDuration * MIN_FOCUS_WINDOW_PERCENTAGE;
            const startTime = Math.min(mouseTime, focusRegion.endTime - minDuration);
            dispatch(
              setFocusRegion({
                endTime: focusRegion.endTime,
                startTime,
              })
            );
            break;
          }
        }
      }
    };

    // Stop all drag operations when the mouse leaves the window.
    const onWindowMouseLeave = (event: MouseEvent) => {
      switch (editMode.type) {
        case "move":
        case "resize-end":
        case "resize-start": {
          setEditMode(null);
          break;
        }
      }
    };

    // Block "mouseup" events for drag-in-progress
    const onWindowMouseUp = (event: MouseEvent) => {
      switch (editMode.type) {
        case "move":
        case "resize-end":
        case "resize-start": {
          // If this was a real mouseup, we should allow this event to pass through to update the current time.
          // If it is part of a drag operation, we shouldn't.
          if (didDragRef.current) {
            stopEvent(event);
          }

          // Don't reset the ref or edit mode during mouse-up.
          // Wait until the subsequent "click" event so that we claim both.
          break;
        }
      }
    };

    timeline.addEventListener("click", onTimelineClick);
    window.addEventListener("click", onWindowClick, true);
    window.addEventListener("mousemove", onWindowMouseMove, true);
    window.addEventListener("mouseleave", onWindowMouseLeave, true);
    window.addEventListener("mouseup", onWindowMouseUp, true);

    return () => {
      timeline.removeEventListener("click", onTimelineClick);
      window.removeEventListener("click", onWindowClick, true);
      window.removeEventListener("mousemove", onWindowMouseMove, true);
      window.removeEventListener("mouseleave", onWindowMouseLeave, true);
      window.removeEventListener("mouseup", onWindowMouseUp, true);
    };
  });

  if (!focusRegion) {
    return null;
  }

  const setEditModeMove = (event: React.MouseEvent) => {
    const draggableArea = draggableAreaRef.current!;
    const { left, width } = draggableArea.getBoundingClientRect();
    const relativeMouseX = event.pageX - left;
    const dragOffset = relativeMouseX - width / 2;
    setEditMode({ dragOffset, type: "move" });
  };
  const setEditModeResizeEnd = () => setEditMode({ type: "resize-end" });
  const setEditModeResizeStart = () => setEditMode({ type: "resize-start" });

  const left = getPositionFromTime(focusRegion.startTime, zoomRegion);
  const right = getPositionFromTime(focusRegion.endTime, zoomRegion);

  return (
    <div className="relative top-0 left-0 h-full w-full" ref={containerRef}>
      <div
        className="group absolute h-full"
        ref={draggableAreaRef}
        style={{
          left: `${left}%`,
          width: `${right - left}%`,
        }}
      >
        <div
          className="h-full w-full rounded-sm bg-themeFocuserBgcolor opacity-50"
          onMouseDown={setEditModeMove}
        />
        <div
          className="absolute top-0 left-0 h-full w-2 transform cursor-ew-resize rounded-l-sm bg-themeFocuserBgcolor group-hover:w-2"
          onMouseDown={setEditModeResizeStart}
        />
        <div
          className="absolute top-0 right-0 h-full w-2 transform cursor-ew-resize rounded-r-sm bg-themeFocuserBgcolor group-hover:w-2"
          onMouseDown={setEditModeResizeEnd}
        />
      </div>
    </div>
  );
}
