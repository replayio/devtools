/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow
import { PureComponent } from "react";
import { toEditorPosition, getDocument, hasDocument } from "../../utils/editor";
import { connect } from "../../utils/connect";
import { getFramePositions } from "../../selectors";
import actions from "../../actions";

import type { SourceLocation, SourceWithContent } from "../../types";

type OwnProps = {||};
type Props = {
  positions: any,
  unexecuted: any,
  seekToPosition: typeof actions.seekToPosition,
};

const jumpButton = document.createElement("img");
jumpButton.src = require("devtools/client/debugger/images/next-circle.svg").default;

function getEditorLine(location, sourceId) {
  if (location.sourceId != sourceId) {
    return undefined;
  }
  return toEditorPosition(location).line;
}

export class ReplayLines extends PureComponent<Props> {
  componentDidMount() {
    const { positions, unexecuted } = this.props;
    this.jumps = [];
    this.unexecutedLines = [];
    this.setLocations(positions, unexecuted);
  }

  componentWillUnmount() {
    this.clearLocations();
  }

  componentDidUpdate() {
    const { positions, unexecuted } = this.props;

    this.clearLocations();
    this.setLocations(positions, unexecuted);
  }

  setLocations(positions, unexecuted) {
    if (positions.length == 0) {
      return;
    }

    const sourceId = positions[0].location.sourceId;

    this.sourceId = sourceId;
    const doc = getDocument(sourceId);
    if (!doc) {
      return;
    }

    const seenLines = new Set();

    // Place jump buttons on each line that is executed by the frame.
    for (const { point, time, location } of positions) {
      const line = getEditorLine(location, sourceId);
      if (line === undefined || seenLines.has(line)) {
        continue;
      }
      seenLines.add(line);

      const widget = jumpButton.cloneNode(true);
      widget.className = "line-jump";
      widget.onclick = () => {
        this.props.seekToPosition(point, time);
      };

      const jump = doc.setBookmark({ line, ch: 0 }, { widget });
      this.jumps.push({ jump, line });
    }

    // Mark all unexecuted lines that don't have a jump button. It is possible
    // for there to be code both executed and not executed on a line, in which
    // case we will treat it as executed.
    //
    // This is disabled for now, see https://github.com/RecordReplay/gecko-dev/issues/141
    /*
    for (const { location, generatedLocation } of unexecuted) {
      const line = getEditorLine(location, generatedLocation, sourceId);
      if (line === undefined || seenLines.has(line)) {
        continue;
      }
      seenLines.add(line);

      doc.addLineClass(line, "line", "unexecuted-line");
    }
    */
  }

  clearLocations(unexecuted) {
    if (!this.sourceId) {
      return;
    }

    this.jumps.forEach(({ jump, line }) => {
      jump.clear();
    });
    this.jumps.length = 0;

    if (!hasDocument(this.sourceId)) {
      return;
    }
    const doc = getDocument(this.sourceId);

    /*
    this.unexecutedLines.forEach(({ line, sourceId }) => {
      doc.removeLineClass(line, "line", "unexecuted-line");
    });
    */
    this.unexecutedLines.length = 0;

    this.sourceId = null;
  }

  render() {
    return null;
  }
}

const mapStateToProps = state => {
  const { positions, unexecuted } = getFramePositions(state) || {
    positions: [],
    unexecuted: [],
  };
  return { positions, unexecuted };
};

export default connect<Props, OwnProps, _, _, _, _>(mapStateToProps, {
  seekToPosition: actions.seekToPosition,
})(ReplayLines);
