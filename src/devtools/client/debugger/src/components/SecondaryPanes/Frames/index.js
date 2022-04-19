/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import PropTypes from "prop-types";
import React, { Component } from "react";

import actions from "../../../actions";
import {
  getFrameworkGroupingState,
  getSelectedFrame,
  getCallStackFrames,
  getThreadContext,
  getFramesLoading,
} from "../../../selectors";
import { copyToTheClipboard } from "../../../utils/clipboard";
import { connect } from "../../../utils/connect";
import { collapseFrames, formatCopyName } from "../../../utils/pause/frames";

import FrameComponent from "./Frame";
import Group from "./Group";

const NUM_FRAMES_SHOWN = 7;

class Frames extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    const { frames, selectedFrame, frameworkGroupingOn } = this.props;
    return (
      frames !== nextProps.frames ||
      selectedFrame !== nextProps.selectedFrame ||
      frameworkGroupingOn !== nextProps.frameworkGroupingOn
    );
  }

  copyStackTrace = () => {
    const { frames } = this.props;
    const { l10n } = this.context;
    const framesToCopy = frames.map(f => formatCopyName(f, l10n)).join("\n");
    copyToTheClipboard(framesToCopy);
  };

  toggleFrameworkGrouping = () => {
    const { toggleFrameworkGrouping, frameworkGroupingOn } = this.props;
    toggleFrameworkGrouping(!frameworkGroupingOn);
  };

  collapseFrames(frames) {
    const { frameworkGroupingOn } = this.props;
    if (!frameworkGroupingOn) {
      return frames;
    }

    return collapseFrames(frames);
  }

  renderFrames(frames) {
    const {
      cx,
      selectFrame,
      selectedFrame,
      toggleBlackBox,
      frameworkGroupingOn,
      displayFullUrl,
      getFrameTitle,
      disableContextMenu,
      panel,
    } = this.props;

    const framesOrGroups = this.collapseFrames(frames);

    // We're not using a <ul> because it adds new lines before and after when
    // the user copies the trace. Needed for the console which has several
    // places where we don't want to have those new lines.
    return (
      <div role="list">
        {framesOrGroups.map(frameOrGroup =>
          frameOrGroup.id ? (
            <FrameComponent
              cx={cx}
              frame={frameOrGroup}
              toggleFrameworkGrouping={this.toggleFrameworkGrouping}
              copyStackTrace={this.copyStackTrace}
              frameworkGroupingOn={frameworkGroupingOn}
              selectFrame={selectFrame}
              selectedFrame={selectedFrame}
              toggleBlackBox={toggleBlackBox}
              key={String(frameOrGroup.id)}
              displayFullUrl={displayFullUrl}
              getFrameTitle={getFrameTitle}
              disableContextMenu={disableContextMenu}
              panel={panel}
            />
          ) : (
            <Group
              cx={cx}
              group={frameOrGroup}
              toggleFrameworkGrouping={this.toggleFrameworkGrouping}
              copyStackTrace={this.copyStackTrace}
              frameworkGroupingOn={frameworkGroupingOn}
              selectFrame={selectFrame}
              selectedFrame={selectedFrame}
              toggleBlackBox={toggleBlackBox}
              key={frameOrGroup[0].id}
              displayFullUrl={displayFullUrl}
              getFrameTitle={getFrameTitle}
              disableContextMenu={disableContextMenu}
              panel={panel}
            />
          )
        )}
      </div>
    );
  }

  render() {
    const { frames, framesLoading } = this.props;

    if (!frames) {
      return (
        <div className="pane frames">
          <div className="pane-info empty">{framesLoading ? "Loading..." : "Not paused"}</div>
        </div>
      );
    }

    return <div className="pane frames">{this.renderFrames(frames || [])}</div>;
  }
}

Frames.contextTypes = { l10n: PropTypes.object };

const mapStateToProps = state => ({
  cx: getThreadContext(state),
  disableContextMenu: false,
  disableFrameTruncate: false,
  displayFullUrl: false,
  frames: getCallStackFrames(state),
  framesLoading: getFramesLoading(state),
  frameworkGroupingOn: getFrameworkGroupingState(state),
  selectedFrame: getSelectedFrame(state),
});

export default connect(mapStateToProps, {
  selectFrame: actions.selectFrame,
  toggleBlackBox: actions.toggleBlackBox,
  toggleFrameworkGrouping: actions.toggleFrameworkGrouping,
})(Frames);

// Export the non-connected component in order to use it outside of the debugger
// panel (e.g. console, netmonitor, …).
export { Frames };
