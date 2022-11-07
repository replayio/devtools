/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { Location } from "@replayio/protocol";
//
import { PureComponent, Suspense, useContext } from "react";

import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { useAppSelector } from "ui/setup/hooks";

import { getDebugLineLocationSuspense } from "../../selectors";
import {
  endOperation,
  getDocument,
  getTokenEnd,
  startOperation,
  toEditorColumn,
} from "../../utils/editor";
import { getIndentation } from "../../utils/indentation";

const lineClass = "new-debug-line";

interface DebugLineProps {
  location: Location;
}

class DebugLineRenderer extends PureComponent<DebugLineProps> {
  debugExpression: any;

  componentDidMount() {
    const { location } = this.props;
    this.setDebugLine(location);
  }

  componentWillUnmount() {
    const { location } = this.props;
    this.clearDebugLine(location);
  }

  componentDidUpdate(prevProps: DebugLineProps) {
    const { location } = this.props;

    startOperation();
    this.clearDebugLine(prevProps.location);
    this.setDebugLine(location);
    endOperation();
  }

  setDebugLine(location: Location) {
    if (!location) {
      return;
    }
    const { sourceId } = location;
    const doc = getDocument(sourceId);
    if (!doc) {
      return;
    }

    const lineIndex = location.line - 1;
    // @ts-expect-error method doesn't exist on Doc
    doc.addLineClass(lineIndex, "line", lineClass);

    const lineText = doc.getLine(lineIndex);
    let column = toEditorColumn(lineText, location.column);
    column = Math.max(column, getIndentation(lineText));

    // If component updates because user clicks on
    // another source tab, codeMirror will be null.
    // @ts-expect-error doc.cm doesn't exist
    const columnEnd = doc.cm ? getTokenEnd(doc.cm, lineIndex, column) : null;

    let markTextClass = "debug-expression";
    if (columnEnd === null) {
      markTextClass += " to-line-end";
    }

    this.debugExpression = doc.markText(
      { ch: column, line: lineIndex },
      { ch: columnEnd!, line: lineIndex },
      { className: markTextClass }
    );
  }

  clearDebugLine(location: Location) {
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
    // @ts-expect-error method doesn't exist on Doc
    doc.removeLineClass(lineIndex, "line", lineClass);
  }

  render() {
    return null;
  }
}

function DebugLine() {
  const replayClient = useContext(ReplayClientContext);
  const location = useAppSelector(state => getDebugLineLocationSuspense(replayClient, state));
  if (!location) {
    return null;
  }
  return <DebugLineRenderer location={location} />;
}

export default function DebugLineSuspenseWrapper() {
  return (
    <Suspense>
      <DebugLine />
    </Suspense>
  );
}
