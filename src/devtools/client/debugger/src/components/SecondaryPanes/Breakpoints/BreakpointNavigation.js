import classnames from "classnames";
import findLast from "lodash/findLast";
import find from "lodash/find";
import { compareNumericStrings } from "protocol/utils";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { connect } from "devtools/client/debugger/src/utils/connect";
import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import MaterialIcon from "ui/components/shared/MaterialIcon";
const { trackEvent } = require("ui/utils/telemetry");

import { useFeature } from "ui/hooks/settings";

import BreakpointTimeline from "./BreakpointTimeline";
import { PanelStatus } from "./PanelStatus";

const colors = {
  blue: "#01ACFD",
  empty: "#F7F7F7",
  empty: "#F7F7F7",
  pink: "#FF87DD",
  yellow: "#FFE870",
};

function CircleBadge({ color, onSelect }) {
  return (
    <div
      onClick={() => onSelect(color)}
      style={{
        backgroundColor: colors[color],
        borderRadius: "10px",
        cursor: "pointer",
        height: "20px",
        marginRight: "5px",
        width: "20px",
      }}
    />
  );
}
function EmojiBadge({ emoji, onSelect }) {
  return (
    <div
      onClick={() => onSelect(emoji)}
      className={`img ${emoji}`}
      style={{
        backgroundColor: "#F7F7F7",
        borderRadius: "10px",
        cursor: "pointer",
        height: "20px",
        marginRight: "5px",
        width: "20px",
      }}
    />
  );
}

function PrefixBadgePicker({ onSelect, pickerNode }) {
  const { top, left } = pickerNode ? pickerNode.getBoundingClientRect() : {};

  return createPortal(
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        boxShadow: "0px 1px 2px 0px #00000040",
        display: "flex",
        padding: "3px 5px",
        position: "absolute",
        right: `${left + 28}px`,
        top: `${top - 3}px`,
        zIndex: 100,
      }}
    >
      <EmojiBadge onSelect={onSelect} emoji="rocket" />
      <EmojiBadge onSelect={onSelect} emoji="unicorn" />
      <EmojiBadge onSelect={onSelect} emoji="target" />
      <CircleBadge onSelect={onSelect} color="pink" />
      <CircleBadge onSelect={onSelect} color="yellow" />
      <CircleBadge onSelect={onSelect} color="blue" />
      <CircleBadge onSelect={onSelect} color="empty" />
    </div>,
    document.body
  );
}

function PrefixBadgeButton({ breakpoint, setBreakpointPrefixBadge }) {
  const [showPrefixBadge, setShowPrefixBadge] = useState(false);
  const pickerNode = useRef();
  const { value: enableUnicornConsole } = useFeature("unicornConsole");

  const prefixBadge = breakpoint.options.prefixBadge;
  const isEmoji = ["unicorn", "rocket", "target"].includes(prefixBadge);
  const isColor = ["blue", "pink", "yellow"].includes(prefixBadge);

  if (!enableUnicornConsole) {
    return null;
  }

  return (
    <button
      className={classnames("h-5 w-5 rounded-full p-px pt-0.5", {
        img: isEmoji,
        rocket: prefixBadge === "rocket",
        target: prefixBadge === "target",
        unicorn: prefixBadge === "unicorn",
      })}
      ref={pickerNode}
      style={{
        backgroundColor: isColor ? colors[prefixBadge] : "white",
        border: "2px solid #c5c5c5",
        borderRadius: "100%",
        height: "1.25rem",
        marginRight: "5px",
        position: "relative",
        width: "21px",
      }}
      onClick={() => {
        setShowPrefixBadge(!showPrefixBadge);
      }}
    >
      {showPrefixBadge && (
        <PrefixBadgePicker
          pickerNode={pickerNode.current}
          onSelect={badge => {
            setShowPrefixBadge(false);
            setBreakpointPrefixBadge(breakpoint, badge);
          }}
        />
      )}
    </button>
  );
}

function BreakpointNavigation({
  executionPoint,
  indexed,
  breakpoint,
  seek,
  analysisPoints,
  editing,
  setShowCondition,
  setBreakpointPrefixBadge,
  showCondition,
  setZoomedBreakpoint = () => {},
}) {
  const [lastExecutionPoint, setLastExecutionPoint] = useState(0);

  const navigateToPoint = point => {
    trackEvent("breakpoint.navigate");
    if (point) {
      seek(point.point, point.time, true);
    }
  };
  const isEmpty = analysisPoints && (analysisPoints.error || analysisPoints.data.length == 0);

  let prev, next;

  if (executionPoint && !analysisPoints?.error && analysisPoints?.data.length > 0) {
    prev = findLast(analysisPoints.data, p => compareNumericStrings(p.point, executionPoint) < 0);
    next = find(analysisPoints.data, p => compareNumericStrings(p.point, executionPoint) > 0);
  }

  useEffect(() => {
    if (executionPoint && lastExecutionPoint !== executionPoint) {
      setLastExecutionPoint(executionPoint);
    }
  }, [executionPoint, lastExecutionPoint]);

  useEffect(() => {
    if (analysisPoints) {
      trackEvent(analysisPoints.data.length > 0 ? "breakpoint.has_hits" : "breakpoint.no_hits", {
        hits: analysisPoints.data.length,
      });
    }
  }, [analysisPoints]);

  if (editing) {
    return (
      <div className="breakpoint-navigation">
        <div className="flex-grow" />
        <PrefixBadgeButton
          breakpoint={breakpoint}
          setBreakpointPrefixBadge={setBreakpointPrefixBadge}
        />
        <button
          className={classnames(
            "h-5 w-5 rounded-full border p-px pt-0.5",
            showCondition
              ? "border-primaryAccent text-primaryAccent"
              : "border-gray-500 text-gray-500"
          )}
          style={{ height: "1.25rem", borderRadius: "100%" }}
          onClick={() => setShowCondition(!showCondition)}
        >
          <MaterialIcon>filter_list</MaterialIcon>
        </button>
      </div>
    );
  }

  return (
    <div className={classnames("breakpoint-navigation", { empty: isEmpty })}>
      {!isEmpty ? (
        <BreakpointNavigationCommands prev={prev} next={next} navigateToPoint={navigateToPoint} />
      ) : null}
      {analysisPoints && !analysisPoints.error ? (
        <BreakpointTimeline breakpoint={breakpoint} setZoomedBreakpoint={setZoomedBreakpoint} />
      ) : (
        <div className="flex-grow" />
      )}
      <div className="text-center">
        <PanelStatus
          indexed={indexed}
          executionPoint={lastExecutionPoint}
          analysisPoints={analysisPoints}
        />
      </div>
    </div>
  );
}

function BreakpointNavigationCommands({ prev, next, navigateToPoint }) {
  const prevDisabled = !prev;
  const nextDisabled = !next;
  return (
    <div className="breakpoint-navigation-commands">
      <button
        className={`breakpoint-navigation-command-prev ${prevDisabled ? " disabled" : ""}`}
        title={prev ? "Jump Back (to previous hit)" : "No previous hit to jump to"}
        disabled={prevDisabled}
        onClick={() => navigateToPoint(prev)}
      >
        <div className="img rewind-rounded" />
      </button>
      <button
        className={`breakpoint-navigation-command-next ${nextDisabled || !next ? " disabled" : ""}`}
        title={next ? "Jump Forward (to next hit)" : "No next hit to jump to"}
        disabled={nextDisabled}
        onClick={() => navigateToPoint(next)}
      >
        <div className="img rewind-rounded" style={{ transform: "rotate(180deg)" }} />
      </button>
    </div>
  );
}

const mapStateToProps = (state, { breakpoint }) => ({
  analysisPoints: selectors.getAnalysisPointsForLocation(
    state,
    breakpoint.location,
    breakpoint.options.condition
  ),
  indexed: selectors.getIsIndexed(state),
  executionPoint: selectors.getExecutionPoint(state),
});

export default connect(mapStateToProps, {
  seek: actions.seek,
  setBreakpointPrefixBadge: actions.setBreakpointPrefixBadge,
})(BreakpointNavigation);
