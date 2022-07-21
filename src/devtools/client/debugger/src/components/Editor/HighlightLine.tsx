/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { Location } from "@replayio/protocol";
import { Component } from "react";
import { connect, ConnectedProps } from "react-redux";

// @ts-expect-error legacy untyped imports
import { toEditorLine, endOperation, startOperation } from "../../utils/editor";
// @ts-expect-error legacy untyped imports
import { getDocument, hasDocument } from "../../utils/editor/source-documents";

import { UIState } from "ui/state";
import type { SourceWithContent } from "devtools/client/debugger/src/reducers/sources";

import {
  getVisibleSelectedFrame,
  getSelectedLocation,
  getSelectedSourceWithContent,
  getPauseCommand,
} from "../../selectors";

type TempFrame = NonNullable<ReturnType<typeof getVisibleSelectedFrame>>;

function isDebugLine(selectedFrame: TempFrame | null, selectedLocation: Location) {
  if (!selectedFrame) {
    return;
  }

  return (
    selectedFrame.location.sourceId == selectedLocation.sourceId &&
    selectedFrame.location.line == selectedLocation.line
  );
}

function isDocumentReady(selectedSource: SourceWithContent | null, selectedLocation: Location) {
  return (
    selectedLocation &&
    selectedSource &&
    selectedSource.content &&
    hasDocument(selectedLocation.sourceId)
  );
}

const mapState = (state: UIState) => {
  const selectedLocation = getSelectedLocation(state);

  if (!selectedLocation) {
    throw new Error("must have selected location");
  }
  return {
    pauseCommand: getPauseCommand(state),
    selectedFrame: getVisibleSelectedFrame(state),
    selectedLocation,
    selectedSource: getSelectedSourceWithContent(state),
  };
};

const connector = connect(mapState);
type PropsFromRedux = ConnectedProps<typeof connector>;

export class HighlightLine extends Component<PropsFromRedux> {
  isStepping = false;
  previousEditorLine: number | null = null;

  shouldComponentUpdate(nextProps: PropsFromRedux) {
    const { selectedLocation, selectedSource } = nextProps;
    return this.shouldSetHighlightLine(selectedLocation, selectedSource);
  }

  componentDidUpdate(prevProps: PropsFromRedux) {
    this.completeHighlightLine(prevProps);
  }

  componentDidMount() {
    this.completeHighlightLine(null);
  }

  shouldSetHighlightLine(selectedLocation: Location, selectedSource: SourceWithContent | null) {
    const { line } = selectedLocation;
    const editorLine = toEditorLine(line);

    if (!isDocumentReady(selectedSource, selectedLocation)) {
      return false;
    }

    if (this.isStepping && editorLine === this.previousEditorLine) {
      return false;
    }

    return true;
  }

  completeHighlightLine(prevProps: PropsFromRedux | null) {
    const { pauseCommand, selectedLocation, selectedFrame, selectedSource } = this.props;
    if (pauseCommand) {
      this.isStepping = true;
    }

    startOperation();
    if (prevProps) {
      this.clearHighlightLine(prevProps.selectedLocation, prevProps.selectedSource);
    }
    this.setHighlightLine(selectedLocation, selectedFrame, selectedSource);
    endOperation();
  }

  setHighlightLine(
    selectedLocation: Location,
    selectedFrame: TempFrame | null,
    selectedSource: SourceWithContent | null
  ) {
    const { sourceId, line } = selectedLocation;
    if (!this.shouldSetHighlightLine(selectedLocation, selectedSource)) {
      return;
    }

    this.isStepping = false;
    const editorLine = toEditorLine(line);
    this.previousEditorLine = editorLine;

    if (!line || isDebugLine(selectedFrame, selectedLocation)) {
      return;
    }

    const doc = getDocument(sourceId);
    doc.addLineClass(editorLine, "line", "highlight-line");
    this.resetHighlightLine(doc, editorLine);
  }

  resetHighlightLine(doc: any, editorLine: number) {
    const editorWrapper = document.querySelector(".editor-wrapper");

    if (editorWrapper === null) {
      return;
    }

    const duration = parseInt(
      getComputedStyle(editorWrapper).getPropertyValue("--highlight-line-duration"),
      10
    );

    setTimeout(() => doc && doc.removeLineClass(editorLine, "line", "highlight-line"), duration);
  }

  clearHighlightLine(selectedLocation: Location, selectedSource: SourceWithContent | null) {
    if (!isDocumentReady(selectedSource, selectedLocation)) {
      return;
    }

    const { line, sourceId } = selectedLocation;
    const editorLine = toEditorLine(line);
    const doc = getDocument(sourceId);
    doc.removeLineClass(editorLine, "line", "highlight-line");
  }

  render() {
    return null;
  }
}

export default connect((state: UIState) => {
  const selectedLocation = getSelectedLocation(state);

  if (!selectedLocation) {
    throw new Error("must have selected location");
  }
  return {
    pauseCommand: getPauseCommand(state),
    selectedFrame: getVisibleSelectedFrame(state),
    selectedLocation,
    selectedSource: getSelectedSourceWithContent(state),
  };
})(HighlightLine);
