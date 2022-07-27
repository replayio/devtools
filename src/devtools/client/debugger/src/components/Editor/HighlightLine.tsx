/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { Component } from "react";
import { connect, ConnectedProps } from "react-redux";

import { toEditorLine, endOperation, startOperation } from "../../utils/editor";
import { getDocument, hasDocument } from "../../utils/editor/source-documents";

import { UIState } from "ui/state";
import type { PartialLocation } from "devtools/client/debugger/src/actions/sources";

import { getVisibleSelectedFrame, getPauseCommand } from "../../selectors";

import {
  getSelectedLocation,
  getSelectedSourceWithContent,
  SourceDetails,
  SourceContent,
} from "ui/reducers/sources";

type TempFrame = NonNullable<ReturnType<typeof getVisibleSelectedFrame>>;

function isDebugLine(selectedFrame?: TempFrame | null, selectedLocation?: PartialLocation) {
  if (!selectedFrame) {
    return;
  }

  return (
    selectedLocation &&
    selectedFrame.location.sourceId == selectedLocation.sourceId &&
    selectedFrame.location.line == selectedLocation.line
  );
}

function isDocumentReady(
  selectedSource?: SourceContent | null,
  selectedLocation?: PartialLocation
) {
  return (
    selectedLocation &&
    selectedSource &&
    selectedSource.value &&
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

  shouldSetHighlightLine(selectedLocation: PartialLocation, selectedSource?: SourceContent | null) {
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
    selectedLocation?: PartialLocation,
    selectedFrame?: TempFrame | null,
    selectedSource?: SourceContent | null
  ) {
    if (!selectedLocation) {
      return;
    }
    const { sourceId, line } = selectedLocation;
    if (!this.shouldSetHighlightLine(selectedLocation, selectedSource)) {
      return;
    }

    this.isStepping = false;
    const editorLine = toEditorLine(line);
    this.previousEditorLine = editorLine;

    if (!line || isDebugLine(selectedFrame!, selectedLocation)) {
      return;
    }

    const doc = getDocument(sourceId);
    // @ts-expect-error method doesn't exist
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

  clearHighlightLine(selectedLocation?: PartialLocation, selectedSource?: SourceContent | null) {
    if (!isDocumentReady(selectedSource, selectedLocation)) {
      return;
    }

    const { line, sourceId } = selectedLocation!;
    const editorLine = toEditorLine(line);
    const doc = getDocument(sourceId);
    // @ts-expect-error method doesn't exist
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
