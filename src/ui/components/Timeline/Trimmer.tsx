import React, { useEffect, useState } from "react";
import { connect, ConnectedProps } from "react-redux";

import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import clamp from "lodash/clamp";
import { TrimOperation, TrimRegion, ZoomRegion } from "ui/state/timeline";
import { getVisiblePosition } from "ui/utils/timeline";
import classNames from "classnames";

type TrimmerProps = PropsFromRedux & { width: number };

const getPosition = (time: number, zoom: ZoomRegion) => {
  const position = getVisiblePosition({ time, zoom }) * 100;
  return clamp(position, 0, 100);
};

function ResizeMask({
  onMouseUp,
  onMouseMove,
}: {
  onMouseUp: ()=> void;
  onMouseMove: ()=> void;
}) {
  // This is so that the mask would overlay the mask overlay and we can detect
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
    <div
      className={classNames("group absolute h-full", draggers ? "cursor-move" : "")}
      style={{ left: `${left}%`, width: `${right - left}%` }}
    >
      <div className="h-full w-full bg-blue-300 opacity-50" onMouseDown={onMouseDown} />
      {draggers}
    </div>
  );
}

function TemporarySpan({ hoverTime, zoomRegion }: { hoverTime: number; zoomRegion: ZoomRegion }) {
  const startTime = hoverTime - zoomRegion.endTime * 0.1;
  const endTime = hoverTime + zoomRegion.endTime * 0.1;

  return <Span {...{ startTime, endTime, zoomRegion }} />;
}

function TrimSpan({
  trimRegion,
  zoomRegion,
  dragging,
  onDragStart,
}: {
  trimRegion: TrimRegion;
  zoomRegion: ZoomRegion;
  dragging: boolean;
  onDragStart: (e: React.MouseEvent, target: TrimOperation) => void;
}) {
  const { startTime, endTime } = trimRegion;
  const draggers = <Draggers {...{ dragging, onDragStart }} />;

  return (
    <Span
      {...{ startTime, endTime, zoomRegion, draggers }}
      onMouseDown={e => onDragStart(e, TrimOperation.moveSpan)}
    />
  );
}

function Trimmer({
  width,
  hoverTime,
  trimRegion,
  setTrimRegion,
  zoomRegion,
  updateTrimRegion,
}: TrimmerProps) {
  const [relativeShift, setRelativeShift] = useState<number | null>(null);
  const [draggingTarget, setDraggingTarget] = useState<TrimOperation | null>(null);

  const onDragStart = (e: React.MouseEvent, target: TrimOperation) => {
    e.stopPropagation();

    setDraggingTarget(target);
    const spanMidpoint = (trimRegion!.endTime + trimRegion!.startTime) / 2;
    setRelativeShift(spanMidpoint - hoverTime!);
  };
  const onMouseUp = () => {
    setDraggingTarget(null);
    setRelativeShift(null);
  };
  const onMouseMove = () => {
    if (!(draggingTarget && relativeShift)) {
      return;
    }
    updateTrimRegion(draggingTarget, relativeShift);
  };

  useEffect(() => {
    if (!trimRegion) {
      setTrimRegion({startTime: 0, endTime: zoomRegion.endTime});
    }
  }, []);

  return (
    <div className="relative top-0 left-0 h-full w-full" >
      {trimRegion ? (
        <TrimSpan
        {...{
          trimRegion,
          zoomRegion,
          updateTrimRegion,
          onDragStart,
        }}
        dragging={!!draggingTarget}
        />
        ) : null}
      {draggingTarget ? <ResizeMask onMouseMove={onMouseMove} onMouseUp={onMouseUp} /> : null}
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    zoomRegion: selectors.getZoomRegion(state),
    hoverTime: selectors.getHoverTime(state),
    trimRegion: selectors.getTrimRegion(state),
  }),
  {
    setTrimRegion: actions.setTrimRegion,
    updateTrimRegion: actions.updateTrimRegion,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Trimmer);
