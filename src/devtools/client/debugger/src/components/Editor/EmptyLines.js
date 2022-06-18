/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { connect } from "react-redux";
import { Component } from "react";
import { getSelectedBreakableLines, getHitCountsForSelectedSource } from "../../selectors";
import { fromEditorLine } from "../../utils/editor";
import { getHitCountsByLine, getHitCountColors } from "../../utils/editor/hit-counts";
import { features } from "ui/utils/prefs";

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
    const { breakableLines, editor, hitCounts } = this.props;
    const hitCountsEnabled = features.hitCounts;
    const hitCountsMap = getHitCountsByLine(hitCounts);

    console.log(hitCountsMap);
    editor.codeMirror.operation(() => {
      editor.codeMirror.eachLine(lineHandle => {
        const line = fromEditorLine(editor.codeMirror.getLineNumber(lineHandle));
        const hitCount = hitCountsMap.get(line);
        if (!hitCountsEnabled) {
          if (hitCount) {
            editor.codeMirror.addLineClass(lineHandle, "line", `hit-count-${hitCount}`);
          }
        } else {
          editor.codeMirror.removeLineClass(lineHandle, "line", "breakable-line");
          if (breakableLines.has(line)) {
            editor.codeMirror.addLineClass(lineHandle, "line", "breakable-line");
          }
        }
      });
    });
  }

  render() {
    return null;
  }
}

const mapStateToProps = state => {
  const breakableLines = getSelectedBreakableLines(state);
  const hitCounts = getHitCountsForSelectedSource(state);

  return {
    breakableLines,
    hitCounts,
  };
};

export default connect(mapStateToProps)(EmptyLines);
