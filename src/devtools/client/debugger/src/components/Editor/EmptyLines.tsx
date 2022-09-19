/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { connect, ConnectedProps } from "react-redux";

import { Component } from "react";
import { fromEditorLine } from "../../utils/editor";
import { getBreakableLinesForSelectedSource } from "ui/reducers/possibleBreakpoints";
import { getBoundsForLineNumber } from "ui/reducers/hitCounts";
import type { UIState } from "ui/state";

import { calculateHitCountChunksForVisibleLines } from "devtools/client/debugger/src/utils/editor/lineHitCounts";
import { editorItemActions } from "./menus/editor";

import type { SourceEditor } from "../../utils/editor/source-editor";

const mapStateToProps = (state: UIState) => {
  const breakableLines = getBreakableLinesForSelectedSource(state);

  const { lower, upper } = getBoundsForLineNumber(state.app.hoveredLineNumberLocation?.line || 0);

  return {
    breakableLines,
    lower,
    upper,
  };
};

const connector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

interface ELProps {
  editor: SourceEditor;
}

type FinalELProps = PropsFromRedux & ELProps;

class EmptyLines extends Component<FinalELProps> {
  _animationFrameId: number | null = null;

  componentDidMount() {
    this.disableEmptyLinesRaf();

    const { editor } = this.props;
    editor.editor.on("scroll", this.disableEmptyLinesRaf);
  }

  componentDidUpdate() {
    this.disableEmptyLinesRaf();
  }

  componentWillUnmount() {
    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
    }

    const { editor, lower, upper } = this.props;
    editor.editor.off("scroll", this.disableEmptyLinesRaf);

    editor.codeMirror.operation(() => {
      editor.codeMirror.eachLine(lower, upper, (lineHandle: any) => {
        editor.codeMirror.removeLineClass(lineHandle, "line", "empty-line");
      });
    });
  }

  disableEmptyLinesRaf = () => {
    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
    }

    this._animationFrameId = requestAnimationFrame(() => {
      this._animationFrameId = null;
      this.disableEmptyLines();
    });
  };

  disableEmptyLines() {
    const { breakableLines, editor, lower, upper } = this.props;

    // Labeled "hit counts", but it's really just breaking lines into into 100-line chunks
    const uniqueChunks = calculateHitCountChunksForVisibleLines(editor);

    // Attempt to update just the markers for just the 100-line blocks  surrounding
    // the current line number
    editor.codeMirror.operation(() => {
      for (let hitCountChunk of uniqueChunks) {
        const { lower, upper } = hitCountChunk;
        editor.codeMirror.eachLine(lower, upper, (lineHandle: any) => {
          const line = fromEditorLine(editor.codeMirror.getLineNumber(lineHandle)!);

          if (breakableLines?.includes(line)) {
            editor.codeMirror.removeLineClass(lineHandle, "line", "empty-line");
          } else {
            editor.codeMirror.addLineClass(lineHandle, "line", "empty-line");
          }
        });
      }
    });
  }

  render() {
    return null;
  }
}

export default connect(mapStateToProps)(EmptyLines);
