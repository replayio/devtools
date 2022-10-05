/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import PropTypes from "prop-types";
import React, { PureComponent } from "react";
import { connect, ConnectedProps } from "react-redux";
import { enterFocusMode as enterFocusModeAction } from "ui/actions/timeline";
import { isCurrentTimeInLoadedRegion } from "ui/reducers/app";
import { getCurrentTime } from "ui/reducers/timeline";
import { formatTimestamp } from "ui/utils/time";

import FrameComponent from "./Frame";
import Group from "./Group";

import actions from "../../../actions";
import { collapseFrames, formatCopyName } from "../../../utils/pause/frames";
import { copyToTheClipboard } from "../../../utils/clipboard";

import {
  getFrameworkGroupingState,
  getSelectedFrame,
  getCallStackFrames,
  getThreadContext,
  getFramesLoading,
  getFramesErrored,
} from "../../../selectors";
import { UIState } from "ui/state";
import type { Context, PauseFrame } from "devtools/client/debugger/src/reducers/pause";

interface FramesProps {
  frames: PauseFrame[] | null;
  selectFrame: (cx: Context, frame: PauseFrame) => void;
  panel: "debugger" | "console" | "webconsole";
}

type FinalFramesProps = FramesProps & PropsFromRedux;

class Frames extends PureComponent<FinalFramesProps> {
  copyStackTrace = () => {
    const { frames } = this.props;
    const framesToCopy = frames!.map(f => formatCopyName(f)).join("\n");
    copyToTheClipboard(framesToCopy);
  };

  toggleFrameworkGrouping = () => {
    const { toggleFrameworkGrouping, frameworkGroupingOn } = this.props;
    toggleFrameworkGrouping(!frameworkGroupingOn);
  };

  collapseFrames(frames: PauseFrame[]) {
    const { frameworkGroupingOn } = this.props;
    if (!frameworkGroupingOn) {
      return frames;
    }

    return collapseFrames(frames);
  }

  renderFrames(frames: PauseFrame[]) {
    const {
      cx,
      selectFrame,
      selectedFrame,
      frameworkGroupingOn,
      displayFullUrl,
      disableContextMenu,
      panel,
    } = this.props;

    const framesOrGroups = this.collapseFrames(frames);

    // We're not using a <ul> because it adds new lines before and after when
    // the user copies the trace. Needed for the console which has several
    // places where we don't want to have those new lines.
    return (
      <div role="list">
        {framesOrGroups.map(frameOrGroup => {
          const commonProps: CommonFrameComponentProps = {
            cx,
            toggleFrameworkGrouping: this.toggleFrameworkGrouping,
            frameworkGroupingOn,
            selectFrame,
            selectedFrame,
            displayFullUrl,
            disableContextMenu,
            copyStackTrace: this.copyStackTrace,
            panel,
          };
          if (Array.isArray(frameOrGroup)) {
            return <Group {...commonProps} group={frameOrGroup} key={frameOrGroup[0].id} />;
          } else {
            return <FrameComponent {...commonProps} frame={frameOrGroup} />;
          }
        })}
      </div>
    );
  }

  render() {
    const {
      currentTime,
      enterFocusMode,
      frames,
      framesErrored,
      framesLoading,
      pauseErrored,
      pauseLoading,
      showUnloadedRegionError,
    } = this.props;

    if (showUnloadedRegionError) {
      return (
        <div className="pane frames">
          <div className="pane-info empty">
            The call stack is unavailable because it is outside{" "}
            <span className="cursor-pointer underline" onClick={enterFocusMode}>
              your debugging window
            </span>
            .
          </div>
        </div>
      );
    }

    if (pauseErrored) {
      return (
        <div className="pane frames">
          <div className="pane-info empty">
            Error trying to pause at {formatTimestamp(currentTime)}
          </div>
        </div>
      );
    }
    if (framesErrored) {
      return (
        <div className="pane frames">
          <div className="pane-info empty">Error loading frames</div>
        </div>
      );
    }
    if (framesLoading || pauseLoading) {
      return (
        <div className="pane frames">
          <div className="pane-info empty">Loading…</div>
        </div>
      );
    }
    if (!frames || frames.length === 0) {
      return (
        <div className="pane frames">
          <div className="pane-info empty">Not paused at a point with a call stack</div>
        </div>
      );
    }

    return <div className="pane frames">{this.renderFrames(frames || [])}</div>;
  }
}

const mapStateToProps = (state: UIState) => ({
  cx: getThreadContext(state),
  currentTime: getCurrentTime(state),
  disableContextMenu: false,
  disableFrameTruncate: false,
  displayFullUrl: false,
  frames: getCallStackFrames(state),
  framesErrored: getFramesErrored(state),
  framesLoading: getFramesLoading(state),
  frameworkGroupingOn: getFrameworkGroupingState(state),
  pauseErrored: state.pause.pauseErrored,
  pauseLoading: state.pause.pauseLoading,
  selectedFrame: getSelectedFrame(state),
  showUnloadedRegionError: !isCurrentTimeInLoadedRegion(state),
});

const connector = connect(mapStateToProps, {
  enterFocusMode: enterFocusModeAction,
  selectFrame: actions.selectFrame,
  toggleFrameworkGrouping: actions.toggleFrameworkGrouping,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

export type CommonFrameComponentProps = Pick<
  PropsFromRedux,
  "cx" | "selectedFrame" | "selectFrame" | "disableContextMenu" | "displayFullUrl"
> & {
  panel: "console" | "debugger" | "webconsole" | "networkmonitor";
  frameworkGroupingOn: boolean;
  copyStackTrace: () => void;
  toggleFrameworkGrouping: () => void;
};

export default connector(Frames);

// Export the non-connected component in order to use it outside of the debugger
// panel (e.g. console, netmonitor, …).
export { Frames };
