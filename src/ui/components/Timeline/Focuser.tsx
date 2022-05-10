import classNames from "classnames";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFocusRegion, setTimelineToTime } from "ui/actions/timeline";
import { selectors } from "ui/reducers";
import { getPositionFromTime, getTimeFromPosition } from "ui/utils/timeline";

type EditMode = {
  dragOffset?: number;
  type: "move" | "move-auto" | "resize-end" | "resize-start";
};

function stopEvent(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

export default function ConditionalFocuser() {
  const focusRegion = useSelector(selectors.getFocusRegion);
  const isFocusing = useSelector(selectors.getIsFocusing);

  if (!focusRegion || !isFocusing) {
    return null;
  }

  return <Focuser />;
}

function Focuser() {
  const dispatch = useDispatch();
  const currentTime = useSelector(selectors.getCurrentTime);
  const focusRegion = useSelector(selectors.getFocusRegion);
  const focusRegionBackup = useSelector(selectors.getFocusRegionBackup);
  const zoomRegion = useSelector(selectors.getZoomRegion);

  // The first time we place a focus mode, it should automatically move to track the cursor.
  // If we're editing an existing focus mode, it should not.
  const [editMode, setEditMode] = useState<EditMode | null>(
    focusRegionBackup === null ? { type: "move-auto" } : null
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const draggableAreaRef = useRef<HTMLDivElement>(null);
  const didDragRef = useRef<boolean>(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !focusRegion || !editMode) {
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

          // Once dragging stops, reset the preview to the current time.
          dispatch(setTimelineToTime(currentTime));
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

        const clampTime = editMode.type !== "move-auto";
        const mouseTime = getTimeFromPosition(relativeMouseX, container, zoomRegion, clampTime);
        if (mouseTime < 0 || mouseTime > zoomRegion.endTime) {
          // Edge case for auto-track mode;
          // When focus mode is entered, it's jarring if the focus region jumps towards the cursor before it mouses into the region.
          return;
        }

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
            dispatch(
              setFocusRegion({
                ...focusRegion,
                endTime: mouseTime,
              })
            );
            break;
          }
          case "resize-start": {
            dispatch(
              setFocusRegion({
                ...focusRegion,
                startTime: mouseTime,
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

    container.addEventListener("click", onTimelineClick);
    window.addEventListener("click", onWindowClick, true);
    window.addEventListener("mousemove", onWindowMouseMove, true);
    window.addEventListener("mouseleave", onWindowMouseLeave, true);
    window.addEventListener("mouseup", onWindowMouseUp, true);

    return () => {
      container.removeEventListener("click", onTimelineClick);
      window.removeEventListener("click", onWindowClick, true);
      window.removeEventListener("mousemove", onWindowMouseMove, true);
      window.removeEventListener("mouseleave", onWindowMouseLeave, true);
      window.removeEventListener("mouseup", onWindowMouseUp, true);
    };
  });

  if (!focusRegion) {
    return null;
  }

  const setEditModeToMove = (event: React.MouseEvent) => {
    const draggableArea = draggableAreaRef.current!;
    const { left, width } = draggableArea.getBoundingClientRect();
    const relativeMouseX = event.pageX - left;
    const dragOffset = relativeMouseX - width / 2;
    setEditMode({ dragOffset, type: "move" });
  };
  const setEditModeToResizeEnd = () => setEditMode({ type: "resize-end" });
  const setEditModeToResizeStart = () => setEditMode({ type: "resize-start" });

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
          className="h-full w-full bg-themeFocuserBgcolor opacity-50"
          onMouseDown={setEditModeToMove}
        />

        <div
          className="absolute top-0 left-0 -ml-2 h-full w-2 transform cursor-ew-resize"
          onMouseDown={setEditModeToResizeStart}
        >
          <div
            className={classNames("absolute right-0 h-full w-1", {
              "bg-themeFocuserBgcolor": editMode?.type !== "resize-start",
              "bg-secondaryAccent": editMode?.type === "resize-start",
            })}
          />
        </div>

        <div
          className="absolute top-0 right-0 -mr-2 h-full w-2 transform cursor-ew-resize"
          onMouseDown={setEditModeToResizeEnd}
        >
          <div
            className={classNames("absolute left-0 h-full w-1", {
              "bg-themeFocuserBgcolor": editMode?.type !== "resize-end",
              "bg-secondaryAccent": editMode?.type === "resize-end",
            })}
          />
        </div>
      </div>
    </div>
  );
}
