/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { Location, PointDescription } from "@replayio/protocol";
import classnames from "classnames";
import React, { Component, Suspense, useContext } from "react";
import ReactTooltip from "react-tooltip";

import { getFrameStepsSuspense } from "bvaughn-architecture-demo/src/suspense/FrameStepsCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { actions } from "ui/actions";
import { SourcesState, getPreferredLocation, getSelectedLocation } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";

import { PartialLocation } from "../../actions/sources/select";
import { PauseFrame, getExecutionPoint } from "../../reducers/pause";
import { getSelectedFrameSuspense } from "../../selectors/pause";

function getBoundingClientRect(element?: HTMLElement) {
  if (!element) {
    return;
  }
  return element.getBoundingClientRect();
}

interface FrameTimelineState {
  scrubbing: boolean;
  scrubbingProgress: number;
  lastDisplayIndex: number;
}

interface FrameTimelineProps {
  executionPoint: string | null;
  selectedLocation: PartialLocation | null;
  selectedFrame: PauseFrame | null;
  frameSteps: PointDescription[] | undefined;
  seek: (point: string, time: number, hasFrames: boolean) => void;
  setPreviewPausedLocation: (location: Location) => void;
  sourcesState: SourcesState;
}

class FrameTimelineRenderer extends Component<FrameTimelineProps, FrameTimelineState> {
  _timeline = React.createRef<HTMLDivElement>();

  state = {
    scrubbing: false,
    scrubbingProgress: 0,
    lastDisplayIndex: 0,
  };

  componentDidUpdate(prevProps: FrameTimelineProps, prevState: FrameTimelineState) {
    if (!document.body) {
      return;
    }

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

  getProgress(clientX: number) {
    const rect = getBoundingClientRect(this._timeline.current || undefined);
    if (!rect) {
      return 0;
    }
    const progress = ((clientX - rect.left) / rect.width) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }

  getPosition(progress: number) {
    const { frameSteps } = this.props;
    if (!frameSteps) {
      return;
    }

    const numberOfPositions = frameSteps.length;
    const displayIndex = Math.floor((progress / 100) * numberOfPositions);

    // We cap the index to the actual existing indices in framePositions.
    // This way, we don't let the index reference an element that doesn't exist.
    // e.g. displayIndex = 3, framePositions.length = 3 => framePositions[3] is undefined
    const adjustedDisplayIndex = Math.min(displayIndex, numberOfPositions - 1);

    this.setState({ lastDisplayIndex: adjustedDisplayIndex });

    return frameSteps[adjustedDisplayIndex];
  }

  displayPreview(progress: number) {
    const { setPreviewPausedLocation, sourcesState } = this.props;

    const frameStep = this.getPosition(progress);

    if (frameStep?.frame) {
      setPreviewPausedLocation(getPreferredLocation(sourcesState, frameStep.frame));
    }
  }

  onMouseDown = (event: React.MouseEvent) => {
    if (!this.props.frameSteps) {
      return null;
    }

    const progress = this.getProgress(event.clientX);
    trackEvent("frame_timeline.start");
    this.setState({ scrubbing: true, scrubbingProgress: progress });
  };

  onMouseUp = (event: MouseEvent) => {
    const { seek } = this.props;

    const progress = this.getProgress(event.clientX);
    const position = this.getPosition(progress);
    this.setState({ scrubbing: false });

    if (position) {
      seek(position.point, position.time, true);
    }
  };

  onMouseMove = (event: MouseEvent) => {
    const progress = this.getProgress(event.clientX);

    this.displayPreview(progress);
    this.setState({ scrubbingProgress: progress });
  };

  getVisibleProgress() {
    const { scrubbing, scrubbingProgress, lastDisplayIndex } = this.state;
    const { frameSteps, selectedLocation, executionPoint } = this.props;

    if (!frameSteps) {
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

    const filteredSteps = frameSteps.filter(
      position => BigInt(position.point) <= BigInt(executionPoint)
    );

    // Check if the current executionPoint's corresponding index is similar to the
    // last index that we stopped scrubbing on. If it is, just use the same progress
    // value that we had while scrubbing so instead of snapping to the executionPoint's
    // progress.
    if (lastDisplayIndex == filteredSteps.length - 1) {
      return scrubbingProgress;
    }

    return Math.floor((filteredSteps.length / frameSteps.length) * 100);
  }

  render() {
    const { scrubbing } = this.state;
    const { frameSteps } = this.props;
    const progress = this.getVisibleProgress();

    return (
      <div
        data-tip="Frame Progress"
        data-for="frame-timeline-tooltip"
        className={classnames("frame-timeline-container", { scrubbing, paused: frameSteps })}
      >
        <div className="frame-timeline-bar" onMouseDown={this.onMouseDown} ref={this._timeline}>
          <div
            className="frame-timeline-progress"
            style={{ width: `${progress}%`, maxWidth: "calc(100% - 2px)" }}
          />
        </div>
        {frameSteps && (
          <ReactTooltip id="frame-timeline-tooltip" delayHide={200} delayShow={200} place={"top"} />
        )}
      </div>
    );
  }
}

function FrameTimeline() {
  const replayClient = useContext(ReplayClientContext);
  const sourcesState = useAppSelector(state => state.sources);
  const executionPoint = useAppSelector(getExecutionPoint);
  const selectedLocation = useAppSelector(getSelectedLocation);
  const selectedFrame = useAppSelector(state => getSelectedFrameSuspense(replayClient, state));
  const frameSteps = selectedFrame
    ? getFrameStepsSuspense(replayClient, selectedFrame.pauseId, selectedFrame.protocolId)
    : undefined;
  const dispatch = useAppDispatch();

  const seek = (point: string, time: number, openSourcesTab: boolean) =>
    dispatch(actions.seek(point, time, openSourcesTab));
  const setPreviewPausedLocation = (location: Location) =>
    dispatch(actions.setPreviewPausedLocation(location));

  return (
    <FrameTimelineRenderer
      executionPoint={executionPoint}
      selectedLocation={selectedLocation}
      selectedFrame={selectedFrame}
      frameSteps={frameSteps}
      sourcesState={sourcesState}
      seek={seek}
      setPreviewPausedLocation={setPreviewPausedLocation}
    />
  );
}

export default function FrameTimelineSuspenseWrapper() {
  return (
    <Suspense
      fallback={
        <div
          data-tip="Frame Progress"
          data-for="frame-timeline-tooltip"
          className="frame-timeline-container"
        >
          <div className="frame-timeline-bar"></div>
        </div>
      }
    >
      <FrameTimeline />
    </Suspense>
  );
}
