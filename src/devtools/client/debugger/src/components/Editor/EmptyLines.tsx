/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { connect, ConnectedProps } from "react-redux";

import { Component } from "react";
import { fromEditorLine } from "../../utils/editor";
import { getBreakableLinesForSelectedSource } from "ui/reducers/possibleBreakpoints";
import { getBoundsForLineNumber } from "ui/reducers/hitCounts";
import type { UIState } from "ui/state";

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
  editor: any;
}

type FinalELProps = PropsFromRedux & ELProps;

class EmptyLines extends Component<FinalELProps> {
  _rafId: number | null = null;

  componentDidMount() {
    this.disableEmptyLinesRaf();
  }

  componentDidUpdate() {
    this.disableEmptyLinesRaf();
  }

  componentWillUnmount() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
    }

    const { editor, lower, upper } = this.props;

    editor.codeMirror.operation(() => {
      editor.codeMirror.eachLine(lower, upper, (lineHandle: any) => {
        editor.codeMirror.removeLineClass(lineHandle, "line", "empty-line");
      });
    });
  }

  disableEmptyLinesRaf = () => {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
    }

    this._rafId = requestAnimationFrame(() => {
      this._rafId = null;
      this.disableEmptyLines();
    });
  };

  disableEmptyLines() {
    const { breakableLines, editor, lower, upper } = this.props;

    editor.codeMirror.operation(() => {
      editor.codeMirror.eachLine(lower, upper, (lineHandle: any) => {
        const line = fromEditorLine(editor.codeMirror.getLineNumber(lineHandle));

        if (breakableLines?.includes(line)) {
          editor.codeMirror.removeLineClass(lineHandle, "line", "empty-line");
        } else {
          editor.codeMirror.addLineClass(lineHandle, "line", "empty-line");
        }
      });
    });
  }

  render() {
    return null;
  }
}

export default connect(mapStateToProps)(EmptyLines);
