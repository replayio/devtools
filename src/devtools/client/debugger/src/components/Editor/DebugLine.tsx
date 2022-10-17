/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import { PureComponent } from "react";
import { connect, ConnectedProps } from "react-redux";

import type { UIState } from "ui/state";

import {
  toEditorColumn,
  getDocument,
  startOperation,
  endOperation,
  getTokenEnd,
} from "../../utils/editor";
import { isException } from "../../utils/pause";
import { getIndentation } from "../../utils/indentation";
import { getPauseReason, getDebugLineLocation } from "../../selectors";

const mapStateToProps = (state: UIState) => {
  return {
    location: getDebugLineLocation(state),
    why: getPauseReason(state),
  };
};

const connector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

export class DebugLine extends PureComponent<PropsFromRedux> {
  debugExpression: any;

  componentDidMount() {
    const { why, location } = this.props;
    this.setDebugLine(why, location);
  }

  componentWillUnmount() {
    const { why, location } = this.props;
    this.clearDebugLine(why, location);
  }

  componentDidUpdate(prevProps: PropsFromRedux) {
    const { why, location } = this.props;

    startOperation();
    this.clearDebugLine(prevProps.why, prevProps.location);
    this.setDebugLine(why, location);
    endOperation();
  }

  setDebugLine(why: PropsFromRedux["why"], location: PropsFromRedux["location"]) {
    if (!location) {
      return;
    }
    const { sourceId } = location;
    const doc = getDocument(sourceId);
    if (!doc) {
      return;
    }

    const lineIndex = location.line - 1;
    let { markTextClass, lineClass } = this.getTextClasses(why);
    // @ts-expect-error method doesn't exist on Doc
    doc.addLineClass(lineIndex, "line", lineClass);

    const lineText = doc.getLine(lineIndex);
    let column = toEditorColumn(lineText, location.column);
    column = Math.max(column, getIndentation(lineText));

    // If component updates because user clicks on
    // another source tab, codeMirror will be null.
    // @ts-expect-error doc.cm doesn't exist
    const columnEnd = doc.cm ? getTokenEnd(doc.cm, lineIndex, column) : null;

    if (columnEnd === null) {
      markTextClass += " to-line-end";
    }

    this.debugExpression = doc.markText(
      { ch: column, line: lineIndex },
      { ch: columnEnd!, line: lineIndex },
      { className: markTextClass }
    );
  }

  clearDebugLine(why: PropsFromRedux["why"], location: PropsFromRedux["location"]) {
    if (!location) {
      return;
    }

    if (this.debugExpression) {
      this.debugExpression.clear();
    }

    const lineIndex = location.line - 1;
    const doc = getDocument(location.sourceId);
    if (!doc) {
      return;
    }
    const { lineClass } = this.getTextClasses(why);
    // @ts-expect-error method doesn't exist on Doc
    doc.removeLineClass(lineIndex, "line", lineClass);
  }

  getTextClasses(why: PropsFromRedux["why"]) {
    if (why && isException(why)) {
      return {
        markTextClass: "debug-expression-error",
        lineClass: "new-debug-line-error",
      };
    }

    return { markTextClass: "debug-expression", lineClass: "new-debug-line" };
  }

  render() {
    return null;
  }
}

export default connector(DebugLine);
