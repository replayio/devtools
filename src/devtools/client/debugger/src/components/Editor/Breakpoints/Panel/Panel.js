/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import classnames from "classnames";
import PanelEditor from "./PanelEditor";
import { toEditorLine } from "devtools/client/debugger/src/utils/editor";

import "./Panel.css";

function PanelSummary({ breakpoint, toggleEditingOn }) {
  const conditionValue = breakpoint.options.condition;
  const logValue = breakpoint.options.logValue;

  return (
    <div className="summary" onClick={toggleEditingOn}>
      <div className="options">
        {conditionValue ? (
          <button className="condition" type="button" onClick={toggleEditingOn}>
            if (<span className="expression">{conditionValue}</span>)
          </button>
        ) : null}
        <button className="log" type="button" onClick={toggleEditingOn}>
          console.log(<span className="expression">{logValue}</span>);
        </button>
      </div>
      <div className="action" tabIndex="0" onClick={toggleEditingOn}>
        Edit
      </div>
    </div>
  );
}

function Widget({ location, children, editor }) {
  const [node, setNode] = useState(null);

  useEffect(() => {
    const _node = document.createElement("div");
    const editorLine = toEditorLine(location.sourceId, location.line || 0);
    const _widget = editor.codeMirror.addLineWidget(editorLine, _node, {
      noHScroll: true,
    });

    setNode(_node);
  }, []);

  if (!node) {
    return null;
  }

  return ReactDOM.createPortal(<>{children}</>, node);
}

function Panel({ breakpoint, editor }) {
  const [editing, setEditing] = useState(false);

  const toggleEditingOn = () => setEditing(true);
  const toggleEditingOff = () => setEditing(false);

  return (
    <Widget location={breakpoint.location} editor={editor}>
      <div className={classnames("breakpoint-panel", { editing })}>
        {editing ? (
          <PanelEditor breakpoint={breakpoint} toggleEditingOff={toggleEditingOff} />
        ) : (
          <PanelSummary breakpoint={breakpoint} toggleEditingOn={toggleEditingOn} />
        )}
      </div>
    </Widget>
  );
}

export default Panel;
