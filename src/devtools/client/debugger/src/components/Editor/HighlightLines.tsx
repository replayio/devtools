/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import { Component } from "react";
import range from "lodash/range";
import isEmpty from "lodash/isEmpty";
import { connect, ConnectedProps } from "react-redux";

import type { UIState } from "ui/state";
import { getHighlightedLineRange } from "../../selectors";

interface HLProps {
  editor: any;
}

const connector = connect((state: UIState) => ({
  highlightedLineRange: getHighlightedLineRange(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

type FinalHLProps = PropsFromRedux & HLProps;

class HighlightLines extends Component<FinalHLProps> {
  componentDidMount() {
    this.highlightLineRange();
  }

  UNSAFE_componentWillUpdate() {
    this.clearHighlightRange();
  }

  componentDidUpdate() {
    this.highlightLineRange();
  }

  componentWillUnmount() {
    this.clearHighlightRange();
  }

  clearHighlightRange() {
    const { highlightedLineRange, editor } = this.props;

    const { codeMirror } = editor;

    if (isEmpty(highlightedLineRange) || !highlightedLineRange || !codeMirror) {
      return;
    }

    const { start, end } = highlightedLineRange;
    codeMirror.operation(() => {
      range(start! - 1, end).forEach(line => {
        codeMirror.removeLineClass(line, "line", "highlight-lines");
      });
    });
  }

  highlightLineRange = () => {
    const { highlightedLineRange, editor } = this.props;

    const { codeMirror } = editor;

    if (isEmpty(highlightedLineRange) || !highlightedLineRange || !codeMirror) {
      return;
    }

    const { start, end } = highlightedLineRange;

    codeMirror.operation(() => {
      editor.alignLine(start);

      range(start! - 1, end).forEach(line => {
        codeMirror.addLineClass(line, "line", "highlight-lines");
      });
    });
  };

  render() {
    return null;
  }
}

export default connector(HighlightLines);
