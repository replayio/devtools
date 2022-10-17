import { PointDescription, TimeStampedPoint } from "@replayio/protocol";
import classnames from "classnames";
import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import { inBreakpointPanel } from "devtools/client/debugger/src/utils/editor";
import { memo, MouseEvent } from "react";
import { connect, ConnectedProps } from "react-redux";
import { Point } from "shared/client/types";
import { actions } from "ui/actions";
import { Circle } from "ui/components/Timeline/Marker";
import { timelineMarkerWidth as pointWidth } from "ui/constants";
import { selectors } from "ui/reducers";
import type { UIState } from "ui/state";
import { HoveredItem } from "ui/state/timeline";

function toBigInt(num?: string | null) {
  return num ? BigInt(num) : undefined;
}

function hasPrimaryHighlight({
  hoveredItem,
  point,
}: {
  hoveredItem: HoveredItem | null;
  point?: PointDescription;
}) {
  return hoveredItem?.point === point?.point;
}

const connector = connect(
  (state: UIState) => ({
    executionPoint: getExecutionPoint(state),
    zoomRegion: selectors.getZoomRegion(state),
  }),
  {
    seek: actions.seek,
    setHoveredItem: actions.setHoveredItem,
    clearHoveredItem: actions.clearHoveredItem,
  }
);

type PropsFromRedux = ConnectedProps<typeof connector>;
type BTPProps = PropsFromRedux & {
  breakpoint: Point;
  point: PointDescription;
  index: number;
  hitPoints: TimeStampedPoint[];
  hoveredItem: HoveredItem | null;
};

function BreakpointTimelinePoint({
  breakpoint,
  point,
  index,
  executionPoint,
  zoomRegion,
  seek,
  hitPoints,
  hoveredItem,
  setHoveredItem,
  clearHoveredItem,
}: BTPProps) {
  const onMouseEnter = () =>
    setHoveredItem({
      target: "widget",
      point: point.point,
      time: point.time,
      location: breakpoint.location,
    });

  const onMouseLeave = (event: MouseEvent<HTMLDivElement>) => {
    if (!inBreakpointPanel(event)) {
      clearHoveredItem();
    }
  };
  const onClick = (event: MouseEvent) => {
    event.stopPropagation();
    seek(point.point, point.time, true);
  };

  const { beginTime, endTime } = zoomRegion;
  const leftPercentOffset = ((point.time - beginTime) / (endTime - beginTime)) * 100;

  const pointInt = toBigInt(point.point)!;
  const executionInt = toBigInt(executionPoint)!;

  return (
    <div
      className={classnames("breakpoint-navigation-timeline-point", {
        past: pointInt < executionInt,
        future: pointInt > executionInt,
        pause: pointInt == executionInt,
        "primary-highlight": hasPrimaryHighlight({ hoveredItem, point }),
      })}
      title={`${index + 1}/${hitPoints.length}`}
      onClick={onClick}
      style={{ left: `calc(${leftPercentOffset}% - ${pointWidth / 2}px)` }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Circle />
    </div>
  );
}

const MemoizedBreakpointTimelinePoint = memo(BreakpointTimelinePoint, (prevProps, nextProps) => {
  function selectorChanged(selector: (props: BTPProps) => any) {
    return selector(nextProps) !== selector(prevProps);
  }

  function hasChanged(key: keyof BTPProps) {
    return nextProps[key] !== prevProps[key];
  }

  if (
    selectorChanged(hasPrimaryHighlight) ||
    hasChanged("zoomRegion") ||
    hasChanged("executionPoint") ||
    hasChanged("hitPoints")
  ) {
    return false;
  }

  return true;
});
MemoizedBreakpointTimelinePoint.displayName = "BreakpointTimelinePoint";

export default connector(MemoizedBreakpointTimelinePoint);
