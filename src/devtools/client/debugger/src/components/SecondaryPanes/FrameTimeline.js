/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// 

import React, { Component } from "react";
import { isEqual } from "lodash";

import { connect } from "../../utils/connect";
import {
  getFramePositions,
  getSelectedFrame,
  getThreadContext,
  getThreadExecutionPoint,
} from "../../selectors";

import { getSelectedLocation } from "../../reducers/sources";

import actions from "../../actions";

import classnames from "classnames";
import "./FrameTimeline.css";



function isSameLocation(frameLocation, selectedLocation) {
  if (!frameLocation || !selectedLocation) {
    return;
  }

  return (
    frameLocation.line === selectedLocation.line &&
    frameLocation.column === selectedLocation.column &&
    frameLocation.sourceId == selectedLocation.sourceId
  );
}

function getBoundingClientRect(element) {
  if (!element) {
    // $FlowIgnore
    return;
  }
  return element.getBoundingClientRect();
}

class FrameTimeline extends Component {
  _timeline;
  _marker;

  constructor(props) {
    super(props);
  }

  state = {
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

    const displayIndex = Math.floor((progress / 100) * framePositions.positions.length);

    return framePositions.positions[displayIndex];
  }

  displayPreview(progress) {
    const { previewLocation } = this.props;

    const position = this.getPosition(progress);

    if (position) {
      previewLocation(position.location);
    }
  }

  onMouseDown = (event) => {
    const progress = this.getProgress(event.clientX);
    this.setState({ scrubbing: true, scrubbingProgress: progress });
  };

  onMouseUp = (event) => {
    const { seekToPosition, selectedLocation } = this.props;

    const progress = this.getProgress(event.clientX);
    const position = this.getPosition(progress);
    this.setState({ scrubbing: false });

    if (position) {
      seekToPosition(position.point, position.time);
    }
  };

  onMouseMove = (event) => {
    const progress = this.getProgress(event.clientX);

    this.displayPreview(progress);
    this.setState({ scrubbingProgress: progress });
  };

  getVisibleProgress() {
    const { scrubbing, scrubbingProgress } = this.state;
    const { framePositions, selectedLocation, selectedFrame, executionPoint } = this.props;

    if (!framePositions) {
      return 0;
    }

    if (scrubbing || !selectedLocation || !executionPoint) {
      return scrubbingProgress;
    }

    let index = 0;
    for (let i = 0; i < framePositions.positions.length; i++, index++) {
      const { location, point } = framePositions.positions[i];
      if (BigInt(executionPoint) <= BigInt(point)) {
        break;
      }
    }

    return Math.floor((index / framePositions.positions.length) * 100);
  }

  renderMarker() {
    return <div className="frame-timeline-marker" ref={r => (this._marker = r)} />;
  }

  renderProgress() {
    const progress = this.getVisibleProgress();

    return (
      <div
        className="frame-timeline-progress"
        style={{ width: `${progress}%`, maxWidth: "calc(100% - 2px)" }}
      />
    );
  }

  renderTimeline() {
    return (
      <div
        className="frame-timeline-bar"
        onMouseDown={this.onMouseDown}
        ref={r => (this._timeline = r)}
      >
        {this.renderProgress()}
        {this.renderMarker()}
      </div>
    );
  }

  render() {
    const { scrubbing } = this.state;
    const { framePositions } = this.props;

    if (!framePositions) {
      return null;
    }

    return (
      <div className={classnames("frame-timeline-container", { scrubbing })}>
        {this.renderTimeline()}
      </div>
    );
  }
}

const mapStateToProps = state => {
  const thread = getThreadContext(state).thread;
  const selectedFrame = getSelectedFrame(state, thread);
  const executionPoint = getThreadExecutionPoint(state, thread);

  return {
    framePositions: getFramePositions(state),
    selectedLocation: getSelectedLocation(state),
    selectedFrame,
    executionPoint,
  };
};

export default connect(mapStateToProps, {
  seekToPosition: actions.seekToPosition,
  previewLocation: actions.previewPausedLocationBySourceId,
})(FrameTimeline);
