import React, { FC, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { actions } from "ui/actions";
import { setFocusRegion, setTimelineState, setTimelineToTime } from "ui/actions/timeline";
import { selectors } from "ui/reducers";
import clamp from "lodash/clamp";
import { FocusOperation, FocusRegion, ZoomRegion } from "ui/state/timeline";
import { getVisiblePosition } from "ui/utils/timeline";
import classNames from "classnames";
import { trackEvent } from "ui/utils/telemetry";
import { MouseDownMask } from "./MouseDownMask";

const getPosition = (time: number, zoom: ZoomRegion) => {
  const position = getVisiblePosition({ time, zoom }) * 100;
  return clamp(position, 0, 100);
};

function ResizeMask({
  draggingTarget,
  onDragEnd,
}: {
  onDragEnd: () => void;
  draggingTarget: FocusOperation;
}) {
  const dispatch = useDispatch();
  const hoverTime = useSelector(selectors.getHoverTime);
  const currentTime = useSelector(selectors.getCurrentTime);
  const focusRegion = useSelector(selectors.getFocusRegion);

  const onMouseMove = () => {
    dispatch(actions.updateFocusRegion(draggingTarget));
  };
  const onMouseUp = (e: MouseEvent) => {
    e.stopPropagation();
    onDragEnd();

    if (
      (draggingTarget === FocusOperation.resizeStart && currentTime < focusRegion!.startTime) ||
      (draggingTarget === FocusOperation.resizeEnd && currentTime > focusRegion!.endTime)
    ) {
      dispatch(setTimelineState({ currentTime: hoverTime! }));
      dispatch(setTimelineToTime(hoverTime));
    }
  };

  return <MouseDownMask onMouseMove={onMouseMove} onMouseUp={onMouseUp} />;
}

function Draggers({
  dragging,
  onDragStart,
}: {
  dragging: boolean;
  onDragStart: (e: React.MouseEvent, target: FocusOperation) => void;
}) {
  const onStartMouseDown = (e: React.MouseEvent) => {
    trackEvent("timeline.drag_start_marker");
    onDragStart(e, FocusOperation.resizeStart);
  };
  const onEndMouseDown = (e: React.MouseEvent) => {
    trackEvent("timeline.drag_start_marker");
    onDragStart(e, FocusOperation.resizeEnd);
  };

  return (
    <>
      <div
        className={classNames(
          dragging ? "w-2" : "w-2",
          "absolute top-0 left-0 h-full transform cursor-ew-resize rounded-l-sm bg-themeFocuserBgcolor group-hover:w-2"
        )}
        onMouseDown={onStartMouseDown}
      />
      <div
        className={classNames(
          dragging ? "w-2" : "w-2",
          "absolute top-0 right-0 h-full transform cursor-ew-resize rounded-r-sm bg-themeFocuserBgcolor group-hover:w-2"
        )}
        onMouseDown={onEndMouseDown}
      />
    </>
  );
}

function Span({
  startTime,
  endTime,
  zoomRegion,
  draggers,
  onMouseDown,
}: {
  startTime: number;
  endTime: number;
  zoomRegion: ZoomRegion;
  onMouseDown?: (e: React.MouseEvent) => void;
  draggers?: JSX.Element;
}) {
  const left = getPosition(startTime, zoomRegion);
  const right = getPosition(endTime, zoomRegion);

  return (
    <div className="group absolute h-full" style={{ left: `${left}%`, width: `${right - left}%` }}>
      <div
        className="h-full w-full rounded-sm bg-themeFocuserBgcolor opacity-50"
        onMouseDown={onMouseDown}
      />
      {draggers}
    </div>
  );
}

function TrimSpan({
  dragging,
  focusRegion,
  onDragStart,
  zoomRegion,
}: {
  dragging: boolean;
  focusRegion: FocusRegion;
  onDragStart: (e: React.MouseEvent, target: FocusOperation) => void;
  zoomRegion: ZoomRegion;
}) {
  const draggers = <Draggers {...{ dragging, onDragStart }} />;
  const { startTime, endTime } = focusRegion;

  return (
    <Span draggers={draggers} endTime={endTime} startTime={startTime} zoomRegion={zoomRegion} />
  );
}

export function Focuser({
  setIsDragging,
  timelineRef,
}: {
  setIsDragging: (isDragging: boolean) => void;
  timelineRef: React.RefObject<HTMLDivElement>;
}) {
  const dispatch = useDispatch();
  const zoomRegion = useSelector(selectors.getZoomRegion);
  const focusRegion = useSelector(selectors.getFocusRegion);
  const focusRegionHasBeenConfirmed = useSelector(selectors.getFocusRegionHasBeenConfirmed);
  const [draggingTarget, setDraggingTarget] = useState<FocusOperation | null>(null);

  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    const timeline = timelineRef.current;

    if (!bar || !focusRegion || !timeline) {
      return;
    }

    const onClick = () => {
      dispatch(setFocusRegion(focusRegion, true));
    };

    const onMouseMove = (event: MouseEvent) => {
      if (focusRegionHasBeenConfirmed) {
        return;
      }

      const { movementX, pageX } = event;
      if (movementX !== 0) {
        // Drag offsets are relative to the smaller/inner "bar" element.
        const rect = bar.getBoundingClientRect();

        // Convert cursor X and DIV width to timestamp.
        const x = pageX - rect.left;
        const zoomRegionDuration = zoomRegion.endTime - zoomRegion.startTime;
        const focusRegionDuration = focusRegion.endTime - focusRegion.startTime;
        const time = zoomRegion.startTime + (x / rect.width) * zoomRegionDuration;

        // Re-center the focus region around the mouse cursor.
        let newEndTime = time + focusRegionDuration / 2;
        let newStartTime = time - focusRegionDuration / 2;

        // Make sure the new focus region is still within our zoom bounds.
        if (newStartTime < zoomRegion.startTime) {
          newEndTime += zoomRegion.startTime - newStartTime;
          newStartTime = zoomRegion.startTime;
        } else if (newEndTime > zoomRegion.endTime) {
          newStartTime -= newEndTime - zoomRegion.endTime;
          newEndTime = zoomRegion.endTime;
        }

        dispatch(
          setFocusRegion(
            {
              endTime: newEndTime,
              startTime: newStartTime,
            },
            false
          )
        );
      }
    };

    // Listen to mouse move events on the larger/outer timeline container.
    // This is the dominant visual element and doing this is a little more forgiving of small user drag errors.
    timeline.addEventListener("click", onClick);
    timeline.addEventListener("mousemove", onMouseMove);
    return () => {
      timeline.removeEventListener("click", onClick);
      timeline.removeEventListener("mousemove", onMouseMove);
    };
  });

  if (!focusRegion) {
    return null;
  }

  // TODO [bvaughn] Naming the FocusOperation param "target" and "draggingTarget" is confusing;
  // these terms have meaning within the drag-and-drop space that aren't what we're using them for here.
  const onDragStart = (event: React.MouseEvent, target: FocusOperation) => {
    event.stopPropagation();

    setIsDragging(true);
    setDraggingTarget(target);
  };
  const onDragEnd = () => {
    setIsDragging(false);
    setDraggingTarget(null);
  };

  return (
    <div className="relative top-0 left-0 h-full w-full" ref={barRef}>
      <TrimSpan
        dragging={!!draggingTarget}
        focusRegion={focusRegion}
        onDragStart={onDragStart}
        zoomRegion={zoomRegion}
      />
      {draggingTarget ? <ResizeMask onDragEnd={onDragEnd} draggingTarget={draggingTarget} /> : null}
    </div>
  );
}
