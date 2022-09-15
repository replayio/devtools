/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React, { Suspense, useContext, useDeferredValue, useEffect, useMemo, useState } from "react";
import classnames from "classnames";
import PanelEditor from "./PanelEditor";
import BreakpointNavigation from "devtools/client/debugger/src/components/SecondaryPanes/Breakpoints/BreakpointNavigation";
import Widget from "./Widget";
import { connect, ConnectedProps } from "react-redux";
import type { UIState } from "ui/state";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import { inBreakpointPanel } from "devtools/client/debugger/src/utils/editor";
import type { Breakpoint } from "devtools/client/debugger/src/reducers/types";
import PanelSummary from "./PanelSummary";
import FirstEditNag from "./FirstEditNag";
import PrefixBadgeButton from "ui/components/PrefixBadge";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import { MAX_POINTS_FOR_FULL_ANALYSIS } from "protocol/thread/analysis";
import { getFocusRegion } from "ui/reducers/timeline";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { UnsafeFocusRegion } from "ui/state/timeline";
import { getHitPointsForLocation } from "bvaughn-architecture-demo/src/suspense/PointsCache";

function getPanelWidth({ editor }: { editor: $FixTypeLater }) {
  // The indent value is an adjustment for the distance from the gutter's left edge
  // to the panel's left edge, which is approximately ~60.
  const panelIndent = 60;

  return editor.getScrollInfo().clientWidth - panelIndent;
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

type $FixTypeLater = any;
type PropsFromRedux = ConnectedProps<typeof connector>;

type ExternalProps = {
  breakpoint?: Breakpoint;
  editor: $FixTypeLater;
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
  const [showCondition, setShowCondition] = useState(Boolean(breakpoint!.options.condition)); // nosemgrep
  const [width, setWidth] = useState(getPanelWidth(editor)); // nosemgrep
  const [inputToFocus, setInputToFocus] = useState<"condition" | "logValue">("logValue");
  const dismissNag = hooks.useDismissNag();

  // WARNING
  // React components should not suspend during a synchronous update.
  // Breakpoint state is in Redux and might get updated at synchronous/default priority.
  // To avoid unintentionally suspending in result to such an update, we use a deferred value.
  // Deferred values automatically lag slightly behind synchronous updates.
  const replayClient = useContext(ReplayClientContext);
  const unsafeFocusRegion = focusRegion ? (focusRegion as UnsafeFocusRegion) : null;
  const breakpointForSuspense = useDeferredValue(breakpoint);
  const unsafeFocusRegionForSuspense = useDeferredValue(unsafeFocusRegion);
  const [hitPoints, hitPointStatus] =
    breakpointForSuspense != null
      ? getHitPointsForLocation(
          replayClient,
          breakpointForSuspense.location,
          breakpointForSuspense.options.condition || null,
          unsafeFocusRegionForSuspense
        )
      : [null, null];

  // If we were fully using concurrent APIs, updates to something like focus range or breakpoint would be done in a transition,
  // which would expose an "is pending" flag that we could use to show e.g. "Loading..." while we're updating breakpoints.
  // In this case, since we're using the deferred API for this, we have to calculate the "is pending" flag ourselves.
  const isPending =
    unsafeFocusRegion !== unsafeFocusRegionForSuspense || breakpoint !== breakpointForSuspense;

  // HACK
  // The TimeStampedPoints within the focus region are always at least as large as (often larger than) the user-defined time range.
  // Because of this, hit points may be returned that fall outside of the user's selection.
  // We should filter these out before passing them to the BreakpointNavigation component.
  const filteredHitPoints = useMemo(() => {
    if (unsafeFocusRegionForSuspense == null) {
      return hitPoints;
    } else {
      return hitPoints
        ? hitPoints.filter(hitPoint => {
            return (
              hitPoint.time >= unsafeFocusRegionForSuspense.beginTime &&
              hitPoint.time <= unsafeFocusRegionForSuspense.endTime
            );
          })
        : null;
    }
  }, [hitPoints, unsafeFocusRegionForSuspense]);

  const pausedOnHit = !!hitPoints?.some(
    ({ point, time }) => point == executionPoint && time == currentTime
  );

  const isHot =
    hitPointStatus === "too-many-points-to-find" ||
    (hitPoints?.length || 0) > MAX_POINTS_FOR_FULL_ANALYSIS;

  useEffect(() => {
    const updateWidth = () => setWidth(getPanelWidth(editor));

    editor.editor.on("refresh", updateWidth);
    return () => {
      editor.editor.off("refresh", updateWidth);
    };
  }, [editor]);

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
      location: breakpoint!.location,
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
    <Widget location={breakpoint!.location} editor={editor} insertAt={insertAt}>
      <div
        className="breakpoint-panel-wrapper mx-3 my-2"
        style={{ width: `${width}px` }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <FirstEditNag editing={editing} />
        <div className={classnames("breakpoint-panel", { editing })}>
          <div
            className="flex py-2 pl-1 pr-2"
            style={{
              backgroundColor: "var(--breakpoint-editfield-active)",
            }}
          >
            <PrefixBadgeButton breakpoint={breakpoint!} />
            <div className="min-w-0 flex-1">
              {editing ? (
                <PanelEditor
                  breakpoint={breakpoint}
                  toggleEditingOff={toggleEditingOff}
                  inputToFocus={inputToFocus}
                  showCondition={showCondition}
                  setShowCondition={setShowCondition}
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
            key={breakpoint?.options.condition}
            breakpoint={breakpoint!}
            editing={editing}
            hitPoints={isPending ? null : filteredHitPoints}
            hitPointStatus={isPending ? null : hitPointStatus}
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
