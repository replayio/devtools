/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { connect } from "react-redux";
import { Component } from "react";
import { fromEditorLine } from "../../utils/editor";
import { getBreakableLinesForSelectedSource } from "ui/reducers/breakableLines";

class EmptyLines extends Component {
  componentDidMount() {
    this.disableEmptyLines();
  }

  componentDidUpdate() {
    this.disableEmptyLines();
  }

  componentWillUnmount() {
    const { editor } = this.props;

    editor.codeMirror.operation(() => {
      editor.codeMirror.eachLine(lineHandle => {
        editor.codeMirror.removeLineClass(lineHandle, "line", "empty-line");
      });
    });
  }

  disableEmptyLines() {
    const { breakableLines, editor } = this.props;

    editor.codeMirror.operation(() => {
      editor.codeMirror.eachLine(lineHandle => {
        const line = fromEditorLine(editor.codeMirror.getLineNumber(lineHandle));

        if (breakableLines.includes(line)) {
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

const mapStateToProps = state => {
  const breakableLines = getBreakableLinesForSelectedSource(state) || [];
  return {
    breakableLines,
  };
};

export default connect(mapStateToProps)(EmptyLines);
