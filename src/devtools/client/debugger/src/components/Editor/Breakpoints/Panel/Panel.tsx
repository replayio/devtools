/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React, { useEffect, useRef, useState } from "react";
import classnames from "classnames";
import PanelEditor from "./PanelEditor";
import BreakpointNavigation from "devtools/client/debugger/src/components/SecondaryPanes/Breakpoints/BreakpointNavigation";
import Widget from "./Widget";
import { connect, ConnectedProps } from "react-redux";
import type { UIState } from "ui/state";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import {
  getAnalysisPointsForLocation,
  AnalysisStatus,
} from "devtools/client/debugger/src/reducers/breakpoints";
import { inBreakpointPanel } from "devtools/client/debugger/src/utils/editor";
import type { Breakpoint } from "devtools/client/debugger/src/reducers/types";
import PanelSummary from "./PanelSummary";
import FirstEditNag from "./FirstEditNag";
import PrefixBadgeButton from "ui/components/PrefixBadge";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import { prefs } from "ui/utils/prefs";
import { AnalysisError, MAX_POINTS_FOR_FULL_ANALYSIS } from "protocol/thread/analysis";

function getPanelWidth({ editor }: { editor: $FixTypeLater }) {
  // The indent value is an adjustment for the distance from the gutter's left edge
  // to the panel's left edge, which is approximately ~60.
  const panelIndent = 60;

  return editor.getScrollInfo().clientWidth - panelIndent;
}

const connector = connect(
  (state: UIState, { breakpoint }: { breakpoint: Breakpoint }) => ({
    analysisPoints: getAnalysisPointsForLocation(
      state,
      breakpoint.location,
      breakpoint.options.condition
    ),
    currentTime: selectors.getCurrentTime(state),
    executionPoint: getExecutionPoint(state),
  }),
  {
    setHoveredItem: actions.setHoveredItem,
    clearHoveredItem: actions.clearHoveredItem,
  }
);

type $FixTypeLater = any;
type PropsFromRedux = ConnectedProps<typeof connector>;

type PanelProps = PropsFromRedux & {
  breakpoint?: Breakpoint;
  editor: $FixTypeLater;
  insertAt: number;
};

function Panel({
  analysisPoints,
  breakpoint,
  currentTime,
  editor,
  executionPoint,
  insertAt,
  setHoveredItem,
  clearHoveredItem,
}: PanelProps) {
  const [editing, setEditing] = useState(false);
  const [showCondition, setShowCondition] = useState(Boolean(breakpoint!.options.condition)); // nosemgrep
  const [width, setWidth] = useState(getPanelWidth(editor)); // nosemgrep
  const [inputToFocus, setInputToFocus] = useState<"condition" | "logValue">("logValue");
  const dismissNag = hooks.useDismissNag();
  const points = analysisPoints?.data;
  const error = analysisPoints?.error;
  const pausedOnHit = !!points?.some(
    ({ point, time }) => point == executionPoint && time == currentTime
  );
  const isHot =
    error === AnalysisError.TooManyPointsToFind ||
    (points?.length || 0) > MAX_POINTS_FOR_FULL_ANALYSIS;

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
                  analysisPoints={analysisPoints}
                  breakpoint={breakpoint}
                  executionPoint={executionPoint}
                  isHot={isHot}
                  pausedOnHit={pausedOnHit}
                  setInputToFocus={setInputToFocus}
                  toggleEditingOn={toggleEditingOn}
                />
              )}
            </div>
          </div>
          <BreakpointNavigation
            breakpoint={breakpoint!}
            editing={editing}
            showCondition={showCondition}
            setShowCondition={setShowCondition}
          />
        </div>
      </div>
    </Widget>
  );
}

export default connector(Panel);
