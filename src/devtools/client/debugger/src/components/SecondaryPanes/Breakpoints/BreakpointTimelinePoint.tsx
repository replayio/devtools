import React from "react";
import { connect, ConnectedProps } from "react-redux";
import classnames from "classnames";
import { selectors } from "ui/reducers";
import { timelineMarkerWidth as pointWidth } from "ui/constants";
import type { UIState } from "ui/state";
import { actions } from "ui/actions";
import { Circle } from "ui/components/Timeline/Marker";
import { inBreakpointPanel } from "devtools/client/debugger/src/utils/editor";
import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import { getLocationKey } from "devtools/client/debugger/src/utils/breakpoint";
import { Breakpoint } from "../../../reducers/types";
import { PointDescription } from "@replayio/protocol";
import { HoveredItem } from "ui/state/timeline";

const { getAnalysisPointsForLocation } = selectors;

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

function hasSecondaryHighlighted({
  hoveredItem,
  breakpoint,
}: {
  hoveredItem: HoveredItem | null;
  breakpoint: Breakpoint;
}) {
  if (!breakpoint.id || !hoveredItem?.location) {
    return false;
  }

  return breakpoint.id == getLocationKey(hoveredItem.location);
}

const connector = connect(
  (state: UIState, { breakpoint }: { breakpoint: Breakpoint }) => ({
    analysisPoints: getAnalysisPointsForLocation(
      state,
      breakpoint.location,
      breakpoint.options.condition
    ),
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
  breakpoint: Breakpoint;
  point: PointDescription;
  index: number;
  hoveredItem: HoveredItem | null;
};

function BreakpointTimelinePoint({
  breakpoint,
  point,
  index,
  analysisPoints,
  executionPoint,
  zoomRegion,
  seek,
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

  const onMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!inBreakpointPanel(e)) {
      clearHoveredItem();
    }
  };
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
        "secondary-highlight": hasSecondaryHighlighted({ hoveredItem, breakpoint }),
      })}
      title={`${index + 1}/${(analysisPoints?.data ?? []).length}`}
      onClick={onClick}
      style={{ left: `calc(${leftPercentOffset}% - ${pointWidth / 2}px)` }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Circle />
    </div>
  );
}

const MemoizedBreakpointTimelinePoint = React.memo(
  BreakpointTimelinePoint,
  (prevProps, nextProps) => {
    function selectorChanged(selector: (props: BTPProps) => any) {
      return selector(nextProps) !== selector(prevProps);
    }

    function hasChanged(key: keyof BTPProps) {
      return nextProps[key] !== prevProps[key];
    }

    if (
      selectorChanged(hasPrimaryHighlight) ||
      selectorChanged(hasSecondaryHighlighted) ||
      hasChanged("zoomRegion") ||
      hasChanged("executionPoint") ||
      hasChanged("analysisPoints")
    ) {
      return false;
    }

    return true;
  }
);
MemoizedBreakpointTimelinePoint.displayName = "BreakpointTimelinePoint";

export default connector(MemoizedBreakpointTimelinePoint);
