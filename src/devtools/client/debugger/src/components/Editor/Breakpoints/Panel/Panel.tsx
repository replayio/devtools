import classnames from "classnames";
import React, { Suspense, useContext, useDeferredValue, useEffect, useMemo, useState } from "react";
import { ConnectedProps, connect } from "react-redux";

import { getHitPointsForLocationSuspense } from "bvaughn-architecture-demo/src/suspense/PointsCache";
import BreakpointNavigation from "devtools/client/debugger/src/components/SecondaryPanes/Breakpoints/BreakpointNavigation";
import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import { inBreakpointPanel } from "devtools/client/debugger/src/utils/editor";
import type { SourceEditor } from "devtools/client/debugger/src/utils/editor/source-editor";
import { MAX_POINTS_FOR_FULL_ANALYSIS } from "protocol/thread/analysis";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Point } from "shared/client/types";
import { actions } from "ui/actions";
import PrefixBadgeButton from "ui/components/PrefixBadge";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import { selectors } from "ui/reducers";
import { getFocusRegion } from "ui/reducers/timeline";
import type { UIState } from "ui/state";

import FirstEditNag from "./FirstEditNag";
import PanelEditor from "./PanelEditor";
import PanelSummary from "./PanelSummary";
import Widget from "./Widget";

const gutterOffset = 37;

function getPanelWidth({ editor }: SourceEditor) {
  return editor.getScrollInfo().clientWidth - gutterOffset;
}

const connector = connect(
  (state: UIState) => ({
    currentTime: selectors.getCurrentTime(state),
    executionPoint: getExecutionPoint(state),
    focusRegion: getFocusRegion(state),
  }),
  {
    setHoveredItem: actions.setHoveredItem,
    clearHoveredItem: actions.clearHoveredItem,
  }
);

type PropsFromRedux = ConnectedProps<typeof connector>;

type ExternalProps = {
  breakpoint: Point;
  editor: SourceEditor;
  insertAt: number;
};

type PanelProps = PropsFromRedux & ExternalProps;

function Panel({
  breakpoint,
  clearHoveredItem,
  currentTime,
  editor,
  executionPoint,
  focusRegion,
  insertAt,
  setHoveredItem,
}: PanelProps) {
  const [editing, setEditing] = useState(false);
  const [showCondition, setShowCondition] = useState(!!breakpoint.condition);
  const [inputToFocus, setInputToFocus] = useState<"condition" | "content">("content");
  const dismissNag = hooks.useDismissNag();

  // WARNING
  // React components should not suspend during a synchronous update.
  // Breakpoint state is in Redux and might get updated at synchronous/default priority.
  // To avoid unintentionally suspending in result to such an update, we use a deferred value.
  // Deferred values automatically lag slightly behind synchronous updates.
  const replayClient = useContext(ReplayClientContext);
  const breakpointForSuspense = useDeferredValue(breakpoint);
  const focusRegionForSuspense = useDeferredValue(focusRegion);
  const [hitPoints, hitPointStatus] =
    breakpointForSuspense != null
      ? getHitPointsForLocationSuspense(
          replayClient,
          breakpointForSuspense.location,
          breakpointForSuspense.condition,
          focusRegionForSuspense
        )
      : [null, null];

  // If we were fully using concurrent APIs, updates to something like focus range or breakpoint would be done in a transition,
  // which would expose an "is pending" flag that we could use to show e.g. "Loading..." while we're updating breakpoints.
  // In this case, since we're using the deferred API for this, we have to calculate the "is pending" flag ourselves.
  const isPending = focusRegion !== focusRegionForSuspense || breakpoint !== breakpointForSuspense;

  // HACK
  // The TimeStampedPoints within the focus region are always at least as large as (often larger than) the user-defined time range.
  // Because of this, hit points may be returned that fall outside of the user's selection.
  // We should filter these out before passing them to the BreakpointNavigation component.
  const filteredHitPoints = useMemo(() => {
    if (focusRegionForSuspense == null) {
      return hitPoints;
    } else {
      return hitPoints
        ? hitPoints.filter(hitPoint => {
            return (
              hitPoint.time >= focusRegionForSuspense.beginTime &&
              hitPoint.time <= focusRegionForSuspense.endTime
            );
          })
        : null;
    }
  }, [hitPoints, focusRegionForSuspense]);

  const pausedOnHit = !!hitPoints?.some(
    ({ point, time }) => point == executionPoint && time == currentTime
  );

  const isHot =
    hitPointStatus === "too-many-points-to-find" ||
    (hitPoints?.length || 0) > MAX_POINTS_FOR_FULL_ANALYSIS;

  useEffect(() => {
    dismissNag(Nag.FIRST_BREAKPOINT_ADD);
  }, [dismissNag]);

  const toggleEditingOn = () => {
    dismissNag(Nag.FIRST_BREAKPOINT_EDIT);
    setEditing(true);
  };

  const toggleEditingOff = () => {
    dismissNag(Nag.FIRST_BREAKPOINT_SAVE);
    setEditing(false);
  };

  const onMouseEnter = () => {
    const hoveredItem = {
      location: breakpoint.location,
      target: "widget",
    };

    // @ts-expect-error hovered item mismatch
    setHoveredItem(hoveredItem);
  };

  const onMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!inBreakpointPanel(e)) {
      clearHoveredItem();
    }
  };

  return (
    <Widget location={breakpoint.location} editor={editor} insertAt={insertAt}>
      <div
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          position: "sticky",
          left: "var(--codemirror-gutter-width)",
          maxWidth: "var(--print-statement-max-width)",
        }}
      >
        <FirstEditNag editing={editing} />
        <div className={classnames("breakpoint-panel", { editing })}>
          <div className="flex items-center space-x-0.5 pt-2 pl-1 pr-4">
            <PrefixBadgeButton point={breakpoint} />
            <div className="min-w-0 flex-1">
              {editing ? (
                <PanelEditor
                  point={breakpoint}
                  toggleEditingOff={toggleEditingOff}
                  inputToFocus={inputToFocus}
                  showCondition={showCondition}
                />
              ) : (
                <PanelSummary
                  breakpoint={breakpoint}
                  executionPoint={executionPoint}
                  hitPoints={filteredHitPoints}
                  isHot={isHot}
                  pausedOnHit={pausedOnHit}
                  setInputToFocus={setInputToFocus}
                  toggleEditingOn={toggleEditingOn}
                />
              )}
            </div>
          </div>
          <BreakpointNavigation
            key={breakpoint?.id}
            breakpoint={breakpoint}
            editing={editing}
            hitPoints={filteredHitPoints}
            hitPointStatus={hitPointStatus}
            isTransitionPending={isPending}
            showCondition={showCondition}
            setShowCondition={setShowCondition}
          />
        </div>
      </div>
    </Widget>
  );
}

const ConnectedPanel = connector(Panel);

export default function ToggleWidgetButtonSuspenseWrapper(props: ExternalProps) {
  return (
    <Suspense fallback={null}>
      <ConnectedPanel {...props} />
    </Suspense>
  );
}
