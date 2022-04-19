/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import classnames from "classnames";
import React, { Component } from "react";
import ReactTooltip from "react-tooltip";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import { trackEvent } from "ui/utils/telemetry";

import { connect } from "../../utils/connect";

function getBoundingClientRect(element) {
  if (!element) {
    // $FlowIgnore
    return;
  }
  return element.getBoundingClientRect();
}

class FrameTimeline extends Component {
  _timeline;

  state = {
    lastDisplayIndex: 0,
    scrubbing: false,
    scrubbingProgress: 0,
  };

  componentDidUpdate(prevProps, prevState) {
    if (!document.body) {
      return;
    }

    // To please Flow.
    const bodyClassList = document.body.classList;

    if (this.state.scrubbing && !prevState.scrubbing) {
      document.addEventListener("mousemove", this.onMouseMove);
      document.addEventListener("mouseup", this.onMouseUp);
      bodyClassList.add("scrubbing");
    }
    if (!this.state.scrubbing && prevState.scrubbing) {
      document.removeEventListener("mousemove", this.onMouseMove);
      document.removeEventListener("mouseup", this.onMouseUp);
      bodyClassList.remove("scrubbing");
    }
  }

  getProgress(clientX) {
    const { width, left } = getBoundingClientRect(this._timeline);
    const progress = ((clientX - left) / width) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }

  getPosition(progress) {
    const { framePositions } = this.props;
    if (!framePositions) {
      return;
    }

    const numberOfPositions = framePositions.positions.length;
    const displayIndex = Math.floor((progress / 100) * numberOfPositions);

    // We cap the index to the actual existing indices in framePositions.
    // This way, we don't let the index reference an element that doesn't exist.
    // e.g. displayIndex = 3, framePositions.length = 3 => framePositions[3] is undefined
    const adjustedDisplayIndex = Math.min(displayIndex, numberOfPositions - 1);

    this.setState({ lastDisplayIndex: adjustedDisplayIndex });

    return framePositions.positions[adjustedDisplayIndex];
  }

  displayPreview(progress) {
    const { setPreviewPausedLocation } = this.props;

    const position = this.getPosition(progress);

    if (position) {
      setPreviewPausedLocation(position.location);
    }
  }

  onMouseDown = event => {
    if (!this.props.framePositions) {
      return null;
    }

    const progress = this.getProgress(event.clientX);
    trackEvent("frame_timeline.start");
    this.setState({ scrubbing: true, scrubbingProgress: progress });
  };

  onMouseUp = event => {
    const { seek, clearPreviewPausedLocation } = this.props;

    const progress = this.getProgress(event.clientX);
    const position = this.getPosition(progress);
    this.setState({ scrubbing: false });

    if (position) {
      seek(position.point, position.time, true);
      clearPreviewPausedLocation();
    }
  };

  onMouseMove = event => {
    const progress = this.getProgress(event.clientX);

    this.displayPreview(progress);
    this.setState({ scrubbingProgress: progress });
  };

  getVisibleProgress() {
    const { scrubbing, scrubbingProgress, lastDisplayIndex } = this.state;
    const { framePositions, selectedLocation, executionPoint } = this.props;

    if (!framePositions) {
      return 0;
    }

    if (scrubbing || !selectedLocation) {
      return scrubbingProgress;
    }

    // If we stepped using the debugger commands and the executionPoint is null
    // because it's being loaded, just show the last progress.
    if (!executionPoint) {
      return;
    }

    const filteredPositions = framePositions.positions.filter(
      position => BigInt(position.point) <= BigInt(executionPoint)
    );

    // Check if the current executionPoint's corresponding index is similar to the
    // last index that we stopped scrubbing on. If it is, just use the same progress
    // value that we had while scrubbing so instead of snapping to the executionPoint's
    // progress.
    if (lastDisplayIndex == filteredPositions.length - 1) {
      return scrubbingProgress;
    }

    return Math.floor((filteredPositions.length / framePositions.positions.length) * 100);
  }

  render() {
    const { scrubbing } = this.state;
    const { framePositions } = this.props;
    const progress = this.getVisibleProgress();

    return (
      <div
        data-tip="Frame Progress"
        data-for="frame-timeline-tooltip"
        className={classnames("frame-timeline-container", { paused: framePositions, scrubbing })}
      >
        <div
          className="frame-timeline-bar"
          onMouseDown={this.onMouseDown}
          ref={r => (this._timeline = r)}
        >
          <div
            className="frame-timeline-progress"
            style={{ maxWidth: "calc(100% - 2px)", width: `${progress}%` }}
          />
        </div>
        {framePositions && (
          <ReactTooltip id="frame-timeline-tooltip" delayHide={200} delayShow={200} place={"top"} />
        )}
      </div>
    );
  }
}

export default connect(
  state => ({
    executionPoint: selectors.getExecutionPoint(state),
    framePositions: selectors.getFramePositions(state),
    selectedFrame: selectors.getSelectedFrame(state),
    selectedLocation: selectors.getSelectedLocation(state),
  }),
  {
    clearPreviewPausedLocation: actions.clearPreviewPausedLocation,
    seek: actions.seek,
    setPreviewPausedLocation: actions.setPreviewPausedLocation,
  }
)(FrameTimeline);
