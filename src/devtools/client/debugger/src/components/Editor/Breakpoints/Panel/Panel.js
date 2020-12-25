/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import classnames from "classnames";
import PanelEditor from "./PanelEditor";
import { toEditorLine } from "devtools/client/debugger/src/utils/editor";
import BreakpointNavigation from "devtools/client/debugger/src/components/SecondaryPanes/Breakpoints/BreakpointNavigation";

import "./Panel.css";

function getEditorWidth({ editor }) {
  return Math.max(editor.getScrollInfo().clientWidth - 60, 300);
}

function PanelSummary({ breakpoint, toggleEditingOn, setInputToFocus }) {
  const conditionValue = breakpoint.options.condition;
  const logValue = breakpoint.options.logValue;

  const handleClick = (event, input) => {
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

function Widget({ location, children, editor, insertAt }) {
  const [node, setNode] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (loading) {
      const _node = document.createElement("div");
      setNode(_node);
      setLoading(false);
      return;
    }
    const editorLine = toEditorLine(location.sourceId, location.line || 0);
    const _widget = editor.codeMirror.addLineWidget(editorLine, node, {
      insertAt,
    });
    return () => {
      _widget.clear();
    };
  }, [loading]);

  if (!node) {
    return null;
  }

  return ReactDOM.createPortal(<>{children}</>, node);
}

function Panel({ breakpoint, editor, insertAt }) {
  const [editing, setEditing] = useState(false);
  const [width, setWidth] = useState(getEditorWidth(editor));
  const [inputToFocus, setInputToFocus] = useState("logValue");

  const toggleEditingOn = () => setEditing(true);
  const toggleEditingOff = () => setEditing(false);
  const setEditorWidth = () => setWidth(getEditorWidth(editor));

  useEffect(() => {
    editor.editor.on("refresh", setEditorWidth);
    return () => editor.editor.off("refresh", setEditorWidth);
  }, []);

  return (
    <Widget location={breakpoint.location} editor={editor} insertAt={insertAt}>
      <div style={{ width: `${width}px` }} className={classnames("breakpoint-panel", { editing })}>
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
            toggleEditingOn={toggleEditingOn}
            setInputToFocus={setInputToFocus}
          />
        )}
        <BreakpointNavigation breakpoint={breakpoint} />
      </div>
    </Widget>
  );
}

export default Panel;
