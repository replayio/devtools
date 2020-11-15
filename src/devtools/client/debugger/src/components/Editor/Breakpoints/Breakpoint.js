/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { PureComponent } from "react";
import classnames from "classnames";
import actions from "devtools/client/debugger/src/actions";
import { connect } from "devtools/client/debugger/src/utils/connect";
import { getDocument, toEditorLine } from "devtools/client/debugger/src/utils/editor";
import { features } from "devtools/client/debugger/src/utils/prefs";

import "./Breakpoints.css";

const breakpointSvg = document.createElement("div");
breakpointSvg.innerHTML =
  '<svg viewBox="0 0 60 15" width="60" height="15"><path d="M53.07.5H1.5c-.54 0-1 .46-1 1v12c0 .54.46 1 1 1h51.57c.58 0 1.15-.26 1.53-.7l4.7-6.3-4.7-6.3c-.38-.44-.95-.7-1.53-.7z"/></svg>';

class Breakpoint extends PureComponent {
  componentDidMount() {
    this.addBreakpoint(this.props);
  }

  componentDidUpdate(prevProps) {
    this.removeBreakpoint(prevProps);
    this.addBreakpoint(this.props);
  }

  componentWillUnmount() {
    this.removeBreakpoint(this.props);
  }

  makeMarker() {
    const { breakpoint } = this.props;
    const bp = breakpointSvg.cloneNode(true);

    bp.className = classnames("editor new-breakpoint", {
      "breakpoint-disabled": breakpoint.disabled,
      "folding-enabled": features.codeFolding,
    });

    bp.onmousedown = this.onClick;
    // NOTE: flow does not know about oncontextmenu
    bp.oncontextmenu = this.onContextMenu;

    return bp;
  }

  onClick = event => {
    const { cx, breakpoint, removeBreakpointsAtLine } = this.props;

    // ignore right clicks
    if ((event.ctrlKey && event.button === 0) || event.button === 2) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();

    const selectedLocation = breakpoint.location;

    return removeBreakpointsAtLine(cx, selectedLocation.sourceId, selectedLocation.line);
  };

  onContextMenu = event => {
    event.stopPropagation();
    event.preventDefault();

    return;
  };

  addBreakpoint(props) {
    const { breakpoint, editor, selectedSource } = props;
    const selectedLocation = breakpoint.location;

    if (!selectedSource) {
      return;
    }

    const sourceId = selectedSource.id;
    const line = toEditorLine(sourceId, selectedLocation.line);
    const doc = getDocument(sourceId);

    doc.setGutterMarker(line, "breakpoints", this.makeMarker());

    editor.codeMirror.addLineClass(line, "line", "new-breakpoint");
    editor.codeMirror.removeLineClass(line, "line", "breakpoint-disabled");

    if (breakpoint.disabled) {
      editor.codeMirror.addLineClass(line, "line", "breakpoint-disabled");
    }
  }

  removeBreakpoint(props) {
    const { selectedSource, breakpoint } = props;
    if (!selectedSource) {
      return;
    }

    const sourceId = selectedSource.id;
    const doc = getDocument(sourceId);

    if (!doc) {
      return;
    }

    const selectedLocation = breakpoint.location;
    const line = toEditorLine(sourceId, selectedLocation.line);

    doc.setGutterMarker(line, "breakpoints", null);
    doc.removeLineClass(line, "line", "new-breakpoint");
    doc.removeLineClass(line, "line", "breakpoint-disabled");
  }

  render() {
    return null;
  }
}

export default connect(null, {
  removeBreakpointsAtLine: actions.removeBreakpointsAtLine,
})(Breakpoint);
