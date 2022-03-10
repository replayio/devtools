import React, { FC, MouseEventHandler, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import clamp from "lodash/clamp";
import { FocusOperation, ZoomRegion } from "ui/state/timeline";
import { getVisiblePosition } from "ui/utils/timeline";
import classNames from "classnames";
import { setTimelineState, setTimelineToTime } from "ui/actions/timeline";
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
      dispatch(setTimelineToTime(hoverTime, true));
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
          dragging ? "w-1" : "w-1",
          "absolute top-0 left-0 h-full transform cursor-ew-resize rounded-full bg-themeFocuserBgcolor group-hover:w-1"
        )}
        onMouseDown={onStartMouseDown}
      />
      <div
        className={classNames(
          dragging ? "w-1" : "w-1",
          "absolute top-0 right-0 h-full transform cursor-ew-resize rounded-full bg-themeFocuserBgcolor group-hover:w-1"
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
      <div className="h-full w-full bg-themeFocuserBgcolor opacity-50" onMouseDown={onMouseDown} />
      {draggers}
    </div>
  );
}

function TrimSpan({
  dragging,
  onDragStart,
}: {
  dragging: boolean;
  onDragStart: (e: React.MouseEvent, target: FocusOperation) => void;
}) {
  const zoomRegion = useSelector(selectors.getZoomRegion);
  const focusRegion = useSelector(selectors.getFocusRegion);

  if (!focusRegion) {
    return null;
  }

  const draggers = <Draggers {...{ dragging, onDragStart }} />;
  const { startTime, endTime } = focusRegion;

  return <Span {...{ startTime, endTime, zoomRegion, draggers }} />;
}

export const Focuser: FC<{ setIsDragging: (isDragging: boolean) => void }> = ({
  setIsDragging,
}) => {
  const dispatch = useDispatch();
  const zoomRegion = useSelector(selectors.getZoomRegion);
  const focusRegion = useSelector(selectors.getFocusRegion);
  const [draggingTarget, setDraggingTarget] = useState<FocusOperation | null>(null);

  const onDragStart = (e: React.MouseEvent, target: FocusOperation) => {
    e.stopPropagation();
    setIsDragging(true);
    setDraggingTarget(target);
  };
  const onDragEnd = () => {
    setIsDragging(false);
    setDraggingTarget(null);
  };

  useEffect(() => {
    if (!focusRegion) {
      const focusRegion = { startTime: 0, endTime: zoomRegion.endTime };
      dispatch(actions.setFocusRegion(focusRegion));
    }

    return () => {
      dispatch(actions.syncFocusedRegion());
      trackEvent("timeline.save_focus");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative top-0 left-0 h-full w-full">
      {focusRegion ? (
        <TrimSpan
          {...{
            focusRegion,
            zoomRegion,
            onDragStart,
          }}
          dragging={!!draggingTarget}
        />
      ) : null}
      {draggingTarget ? <ResizeMask onDragEnd={onDragEnd} draggingTarget={draggingTarget} /> : null}
    </div>
  );
};
