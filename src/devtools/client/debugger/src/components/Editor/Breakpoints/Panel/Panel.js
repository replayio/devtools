/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import classnames from "classnames";
import BreakpointNavigation from "devtools/client/debugger/src/components/SecondaryPanes/Breakpoints/BreakpointNavigation";
import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import { inBreakpointPanel } from "devtools/client/debugger/src/utils/editor";
import React, { useEffect, useRef, useState } from "react";
import { connect } from "react-redux";
import { actions } from "ui/actions";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import { selectors } from "ui/reducers";
import { prefs } from "ui/utils/prefs";

import FirstEditNag from "./FirstEditNag";
import PanelEditor from "./PanelEditor";
import PanelSummary from "./PanelSummary";
import Widget from "./Widget";

function getPanelWidth({ editor }) {
  // The indent value is an adjustment for the distance from the gutter's left edge
  // to the panel's left edge, which is approximately ~60.
  const panelIndent = 60;

  return editor.getScrollInfo().clientWidth - panelIndent;
}

function Panel({
  analysisPoints,
  breakpoint,
  currentTime,
  editor,
  executionPoint,
  insertAt,
  setHoveredItem,
  clearHoveredItem,
}) {
  const [editing, setEditing] = useState(false);
  const [showCondition, setShowCondition] = useState(Boolean(breakpoint.options.condition)); // nosemgrep
  const [width, setWidth] = useState(getPanelWidth(editor)); // nosemgrep
  const [inputToFocus, setInputToFocus] = useState("logValue");
  const dismissNag = hooks.useDismissNag();
  const pausedOnHit =
    analysisPoints &&
    !analysisPoints.error &&
    !!analysisPoints?.data.find(
      ({ point, time }) => point == executionPoint && time == currentTime
    );
  const isHot =
    analysisPoints &&
    (analysisPoints.error || (analysisPoints.data.length || 0) > prefs.maxHitsDisplayed);

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
      location: breakpoint.location,
      target: "widget",
    };

    setHoveredItem(hoveredItem);
  };

  const onMouseLeave = e => {
    if (!inBreakpointPanel(e)) {
      clearHoveredItem();
    }
  };

  return (
    <Widget location={breakpoint.location} editor={editor} insertAt={insertAt}>
      <div
        className="breakpoint-panel-wrapper mx-3 my-2"
        style={{ width: `${width}px` }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <FirstEditNag editing={editing} />
        <div className={classnames("breakpoint-panel", { editing })}>
          {editing ? (
            <PanelEditor
              breakpoint={breakpoint}
              toggleEditingOff={toggleEditingOff}
              inputToFocus={inputToFocus}
              showCondition={showCondition}
              setShowCondition={setShowCondition}
              dismissNag={dismissNag}
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
          <BreakpointNavigation {...{ breakpoint, editing, setShowCondition, showCondition }} />
        </div>
      </div>
    </Widget>
  );
}

export default connect(
  (state, { breakpoint }) => ({
    analysisPoints: selectors.getAnalysisPointsForLocation(
      state,
      breakpoint.location,
      breakpoint.options.condition
    ),
    currentTime: selectors.getCurrentTime(state),
    executionPoint: getExecutionPoint(state),
  }),
  {
    clearHoveredItem: actions.clearHoveredItem,
    setHoveredItem: actions.setHoveredItem,
  }
)(Panel);
