/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import React, { useEffect, useState } from "react";
import classnames from "classnames";
import PanelEditor from "./PanelEditor";
import BreakpointNavigation from "devtools/client/debugger/src/components/SecondaryPanes/Breakpoints/BreakpointNavigation";
import Widget from "./Widget";

import { connect } from "react-redux";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import { inBreakpointPanel } from "devtools/client/debugger/src/utils/editor";
import PanelSummary from "./PanelSummary";
import FirstEditNag from "./FirstEditNag";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import { prefs } from "ui/utils/prefs";
import { shouldShowNag } from "ui/utils/user";

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
  const [showCondition, setShowCondition] = useState(!!breakpoint.options.condition);
  const [width, setWidth] = useState(getPanelWidth(editor));
  const [inputToFocus, setInputToFocus] = useState("logValue");
  const dismissNag = hooks.useDismissNag();
  const error = analysisPoints === "error";
  const pausedOnHit =
    !error &&
    !!analysisPoints?.find(({ point, time }) => point == executionPoint && time == currentTime);
  const isHot = !error && (analysisPoints?.length || 0) > prefs.maxHitsDisplayed;
  const showNag = analysisPoints && !error && !isHot && shouldShowNag(Nag.FIRST_BREAKPOINT_ADD);

  useEffect(() => {
    editor.editor.on("refresh", updateWidth);
    dismissNag(Nag.FIRST_GUTTER_CLICK);

    return () => {
      dismissNag(Nag.FIRST_BREAKPOINT_REMOVED);
      editor.editor.off("refresh", updateWidth);
    };
  }, []);

  useEffect(() => {
    // Force CodeMirror to refresh when changing the size of the breakpoint
    // panel so that code selection works properly.
    window.dispatchEvent(new Event("resize"));
  });

  const toggleEditingOn = () => {
    dismissNag(Nag.FIRST_BREAKPOINT_ADD);
    setEditing(true);
  };

  const toggleEditingOff = () => {
    dismissNag(Nag.FIRST_BREAKPOINT_EDIT);
    setEditing(false);
  };

  const updateWidth = () => setWidth(getPanelWidth(editor));

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
        {showNag && <FirstEditNag editing={editing} />}
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
          <BreakpointNavigation {...{ breakpoint, editing, showCondition, setShowCondition }} />
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
    setHoveredItem: actions.setHoveredItem,
    clearHoveredItem: actions.clearHoveredItem,
  }
)(Panel);
