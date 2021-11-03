/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import React, { useEffect, useState } from "react";
import classnames from "classnames";
import PanelEditor from "./PanelEditor";
import BreakpointNavigation from "devtools/client/debugger/src/components/SecondaryPanes/Breakpoints/BreakpointNavigation";
import Widget from "./Widget";

import "./Panel.css";
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
  const { nags } = hooks.useGetUserInfo();
  const updateUserNags = hooks.useUpdateUserNags();
  const dismissNag = hooks.useDismissNag();
  const error = analysisPoints === "error";
  const pausedOnHit =
    !error &&
    !!analysisPoints?.find(({ point, time }) => point == executionPoint && time == currentTime);
  const isHot = !error && (analysisPoints?.length || 0) > prefs.maxHitsDisplayed;
  const showNag =
    analysisPoints && !error && !isHot && nags && !nags.includes(Nag.FIRST_BREAKPOINT_ADD);

  useEffect(() => {
    dismissNag(Nag.FIRST_GUTTER_CLICK);

    // Make sure to toggle off the first_breakpoint_add nag once the widget is opened.
    if (showNag) {
      const newNags = [...nags, Nag.FIRST_BREAKPOINT_ADD];
      updateUserNags({
        variables: { newNags },
      });
    }
  }, []);

  useEffect(() => {
    // Force CodeMirror to refresh when changing the size of the breakpoint
    // panel so that code selection works properly.
    window.dispatchEvent(new Event("resize"));
  });

  const toggleEditingOn = () => setEditing(true);
  const toggleEditingOff = () => setEditing(false);
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

  useEffect(() => {
    editor.editor.on("refresh", updateWidth);
    return () => editor.editor.off("refresh", updateWidth);
  }, []);

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
