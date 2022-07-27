/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import React, { Component } from "react";
import classnames from "classnames";
import { connect, ConnectedProps } from "react-redux";
import type { Location } from "@replayio/protocol";

import type { Context } from "devtools/client/debugger/src/reducers/pause";
import actions from "../../actions";

import { getDocument } from "../../utils/editor";
import Panel from "./Breakpoints/Panel/Panel";
import { features } from "ui/utils/prefs";
import { isLogpoint } from "../../utils/breakpoint";
import { Breakpoint } from "../../reducers/types";
import type { SourceDetails } from "ui/reducers/sources";

const breakpointButton = document.createElement("button");
breakpointButton.innerHTML =
  '<svg viewBox="0 0 11 13" width="11" height="13"><path d="M5.07.5H1.5c-.54 0-1 .46-1 1v10c0 .54.46 1 1 1h3.57c.58 0 1.15-.26 1.53-.7l3.7-5.3-3.7-5.3C6.22.76 5.65.5 5.07.5z"/></svg>';

function makeBookmark(
  { breakpoint }: ColumnBreakpointType,
  { onClick, onContextMenu }: { onClick: (e: any) => void; onContextMenu: (e: any) => void }
) {
  const bp = breakpointButton.cloneNode(true) as HTMLButtonElement;

  const isActive = breakpoint && !breakpoint.disabled;
  const isDisabled = breakpoint && breakpoint.disabled;
  const condition = breakpoint && breakpoint.options.condition;
  const logValue = breakpoint && breakpoint.options.logValue;

  bp.className = classnames("column-breakpoint", {
    active: isActive,
    disabled: isDisabled,
  });

  bp.setAttribute("title", logValue || condition || "");
  bp.onclick = onClick;

  // NOTE: flow does not know about oncontextmenu
  bp.oncontextmenu = onContextMenu;

  return bp;
}

const connector = connect(null, {
  addBreakpointAtColumn: actions.addBreakpointAtColumn,
  removeBreakpoint: actions._removeBreakpoint,
});

type $FixTypeLater = any;

interface ColumnBreakpointType {
  location: Location;
  breakpoint?: Breakpoint;
}

type PropsFromRedux = ConnectedProps<typeof connector>;

type CBProps = PropsFromRedux & {
  cx: Context;
  columnBreakpoint: ColumnBreakpointType;
  editor: $FixTypeLater;
  source: SourceDetails;
  insertAt: number;
};

class ColumnBreakpoint extends Component<CBProps> {
  bookmark: any;

  addColumnBreakpoint = (nextProps?: CBProps) => {
    const { columnBreakpoint, source } = nextProps || this.props;

    if (!features.columnBreakpoints) {
      return null;
    }

    const sourceId = source!.id;
    const doc = getDocument(sourceId);
    if (!doc) {
      return;
    }

    const { line, column } = columnBreakpoint.location;
    if (column === undefined) {
      return;
    }

    const widget = makeBookmark(columnBreakpoint, {
      onClick: this.onClick,
      onContextMenu: this.onContextMenu,
    });

    this.bookmark = doc.setBookmark({ line: line - 1, ch: column }, { widget });
  };

  clearColumnBreakpoint = () => {
    if (this.bookmark) {
      this.bookmark.clear();
      this.bookmark = null;
    }
  };

  onClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const { cx, columnBreakpoint, addBreakpointAtColumn, removeBreakpoint } = this.props;

    if (columnBreakpoint.breakpoint) {
      removeBreakpoint(cx, columnBreakpoint.breakpoint);
    } else {
      addBreakpointAtColumn(cx, columnBreakpoint.location);
    }
  };

  onContextMenu = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    return;
  };

  componentDidMount() {
    this.addColumnBreakpoint();
  }

  componentWillUnmount() {
    this.clearColumnBreakpoint();
  }

  componentDidUpdate() {
    this.clearColumnBreakpoint();
    this.addColumnBreakpoint();
  }

  shouldComponentUpdate(nextProps: CBProps) {
    return this.props.columnBreakpoint.breakpoint != nextProps.columnBreakpoint.breakpoint;
  }

  render() {
    const { editor, columnBreakpoint, insertAt } = this.props;
    const { breakpoint } = columnBreakpoint;

    if (!breakpoint || !isLogpoint(breakpoint)) {
      return null;
    }

    return <Panel breakpoint={columnBreakpoint.breakpoint!} editor={editor} insertAt={insertAt} />;
  }
}

export default connector(ColumnBreakpoint);
