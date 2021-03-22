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
import { inBreakpointPanel } from "devtools/client/debugger/src/utils/editor";
import { displayedBreakpointMaxHits, editableBreakpointMaxHits } from "ui/constants";

function getPanelWidth({ editor }) {
  // The indent value is an adjustment for the distance from the gutter's left edge
  // to the panel's left edge, which is approximately ~60.
  const panelIndent = 60;

  return editor.getScrollInfo().clientWidth - panelIndent;
}

function PanelSummary({ breakpoint, toggleEditingOn, isEditable, setInputToFocus }) {
  const conditionValue = breakpoint.options.condition;
  const logValue = breakpoint.options.logValue;

  const handleClick = (event, input) => {
    if (!isEditable) {
      return;
    }

    event.stopPropagation();
    toggleEditingOn();
    setInputToFocus(input);
  };

  return (
    <>
      <div className="summary" onClick={e => handleClick(e, "logValue")}>
        <div className="options">
          {conditionValue ? (
            <button className="condition" type="button" onClick={e => handleClick(e, "condition")}>
              if (<span className="expression">{conditionValue}</span>)
            </button>
          ) : null}
          <button className="log" type="button" onClick={e => handleClick(e, "logValue")}>
            log(<span className="expression">{logValue}</span>)
          </button>
        </div>
        <div className="action" tabIndex="0" onClick={e => handleClick(e, "logValue")}>
          Edit
        </div>
      </div>
    </>
  );
}

function Panel({ breakpoint, editor, insertAt, setHoveredItem, clearHoveredItem, analysisPoints }) {
  const [editing, setEditing] = useState(false);
  const [width, setWidth] = useState(getPanelWidth(editor));
  const [inputToFocus, setInputToFocus] = useState("logValue");

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

  const isHot = analysisPoints?.length > displayedBreakpointMaxHits;
  const isEditable = analysisPoints?.length > editableBreakpointMaxHits;

  if (isHot) {
    return (
      <Widget location={breakpoint.location} editor={editor} insertAt={insertAt}>
        <div className="breakpoint-panel">
          <div className="warning">
            <span className="material-icons">warning</span>
            <span className="warning-content">{`Sorry! We can't display this breakpoint because it has too many hits.`}</span>
          </div>
        </div>
      </Widget>
    );
  }

  return (
    <Widget location={breakpoint.location} editor={editor} insertAt={insertAt}>
      <div
        style={{ width: `${width}px` }}
        className={classnames("breakpoint-panel", { editing })}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {editing ? (
          <PanelEditor
            breakpoint={breakpoint}
            toggleEditingOff={toggleEditingOff}
            inputToFocus={inputToFocus}
            setInputToFocus={setInputToFocus}
          />
        ) : (
          <PanelSummary
            breakpoint={breakpoint}
            editable={isEditable}
            toggleEditingOn={toggleEditingOn}
            setInputToFocus={setInputToFocus}
          />
        )}
        <BreakpointNavigation breakpoint={breakpoint} />
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
  }),
  { setHoveredItem: actions.setHoveredItem, clearHoveredItem: actions.clearHoveredItem }
)(Panel);
