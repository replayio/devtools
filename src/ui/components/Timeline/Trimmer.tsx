import React, { MouseEventHandler, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import clamp from "lodash/clamp";
import { TrimOperation, ZoomRegion } from "ui/state/timeline";
import { getVisiblePosition } from "ui/utils/timeline";
import classNames from "classnames";
import { setTimelineState, setTimelineToTime } from "ui/actions/timeline";

const getPosition = (time: number, zoom: ZoomRegion) => {
  const position = getVisiblePosition({ time, zoom }) * 100;
  return clamp(position, 0, 100);
};

function ResizeMask({
  onMouseUp,
  onMouseMove,
}: {
  onMouseUp: MouseEventHandler;
  onMouseMove: () => void;
}) {
  // This is so that the mask would overlay the modal's mask and we can detect
  // mouse movement throughout the entire screen.
  const zIndex = 100;

  return (
    <div
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      className="fixed top-0 left-0 h-full w-full opacity-50"
      style={{ cursor: "ew-resize", zIndex }}
    />
  );
}

function Draggers({
  dragging,
  onDragStart,
}: {
  dragging: boolean;
  onDragStart: (e: React.MouseEvent, target: TrimOperation) => void;
}) {
  return (
    <>
      <div
        className={classNames(
          dragging ? "w-1" : "w-0.5",
          "absolute top-0 left-0 h-full transform cursor-ew-resize rounded-full bg-blue-500 group-hover:w-1"
        )}
        onMouseDown={e => onDragStart(e, TrimOperation.resizeStart)}
      />
      <div
        className={classNames(
          dragging ? "w-1" : "w-0.5",
          "absolute top-0 right-0 h-full transform cursor-ew-resize rounded-full bg-blue-500 group-hover:w-1"
        )}
        onMouseDown={e => onDragStart(e, TrimOperation.resizeEnd)}
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
      <div className="h-full w-full bg-blue-300 opacity-50" onMouseDown={onMouseDown} />
      {draggers}
    </div>
  );
}

function TrimSpan({
  dragging,
  onDragStart,
}: {
  dragging: boolean;
  onDragStart: (e: React.MouseEvent, target: TrimOperation) => void;
}) {
  const zoomRegion = useSelector(selectors.getZoomRegion);
  const trimRegion = useSelector(selectors.getTrimRegion);

  if (!trimRegion) {
    return null;
  }

  const draggers = <Draggers {...{ dragging, onDragStart }} />;
  const { startTime, endTime } = trimRegion;

  return <Span {...{ startTime, endTime, zoomRegion, draggers }} />;
}

export const Trimmer: React.FC = () => {
  const dispatch = useDispatch();
  const zoomRegion = useSelector(selectors.getZoomRegion);
  const hoverTime = useSelector(selectors.getHoverTime);
  const currentTime = useSelector(selectors.getCurrentTime);
  const trimRegion = useSelector(selectors.getTrimRegion);
  const [draggingTarget, setDraggingTarget] = useState<TrimOperation | null>(null);

  const onDragStart = (e: React.MouseEvent, target: TrimOperation) => {
    e.stopPropagation();
    setDraggingTarget(target);
  };
  const onMouseUp: MouseEventHandler = e => {
    e.stopPropagation();
    setDraggingTarget(null);
    if (
      (draggingTarget === TrimOperation.resizeStart && currentTime < trimRegion!.startTime) ||
      (draggingTarget === TrimOperation.resizeEnd && currentTime > trimRegion!.endTime)
    ) {
      dispatch(setTimelineState({ currentTime: hoverTime! }));
      dispatch(setTimelineToTime(hoverTime, true));
    }
  };
  const onMouseMove = () => {
    if (!draggingTarget) {
      return;
    }
    dispatch(actions.updateTrimRegion(draggingTarget));
  };
  useEffect(() => {
    if (!trimRegion) {
      const trimRegion = { startTime: 0, endTime: zoomRegion.endTime };
      dispatch(actions.setTrimRegion(trimRegion));
    }

    return () => {
      dispatch(actions.syncTrimmedRegion());
    };
  }, []);

  return (
    <div className="relative top-0 left-0 h-full w-full">
      {trimRegion ? (
        <TrimSpan
          {...{
            trimRegion,
            zoomRegion,
            onDragStart,
          }}
          dragging={!!draggingTarget}
        />
      ) : null}
      {draggingTarget ? <ResizeMask onMouseMove={onMouseMove} onMouseUp={onMouseUp} /> : null}
    </div>
  );
};
