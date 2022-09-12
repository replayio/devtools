/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { ContainerItem, ValueItem } from "devtools/packages/devtools-reps";
import React, { PureComponent } from "react";
import { connect, ConnectedProps } from "react-redux";
import { enterFocusMode as enterFocusModeAction } from "ui/actions/timeline";
import { Redacted } from "ui/components/Redacted";
import { isCurrentTimeInLoadedRegion } from "ui/reducers/app";
import { getCurrentTime } from "ui/reducers/timeline";
import { formatTimestamp } from "ui/utils/time";

import {
  getSelectedFrame,
  getFrameScope,
  getPauseReason,
  getThreadContext,
  getFramesLoading,
} from "../../selectors";
import { getScopes } from "../../utils/pause/scopes";
import NewObjectInspector from "./NewObjectInspector";
import { UIState } from "ui/state";

type StateScopes = (ContainerItem | ValueItem)[] | null;
interface ScopesState {
  scopes: StateScopes;
}

type Why = PropsFromRedux["why"];
type SelectedFrame = PropsFromRedux["selectedFrame"];
type FrameScopes = PropsFromRedux["frameScopes"];

class Scopes extends PureComponent<PropsFromRedux, ScopesState> {
  state = { scopes: null as StateScopes };

  componentDidMount() {
    const { why, selectedFrame, frameScopes } = this.props;
    this.updateScopes(why, selectedFrame, frameScopes);
  }

  async updateScopes(why: Why, selectedFrame: SelectedFrame, frameScopes: FrameScopes) {
    const scopes = getScopes(why, selectedFrame, frameScopes);
    if (scopes) {
      const scopesToLoad = scopes.filter(
        scope => scope!.type === "value" && (!scope as any)!.loaded
      );
      await Promise.all(scopesToLoad.map(scope => (scope!.contents as any)!.load()));
      this.setState({ scopes: scopes as StateScopes });
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: PropsFromRedux) {
    const { cx, selectedFrame, frameScopes } = this.props;
    const isPausedChanged = cx.isPaused !== nextProps.cx.isPaused;
    const selectedFrameChanged = selectedFrame !== nextProps.selectedFrame;
    const frameScopesChanged = frameScopes !== nextProps.frameScopes;

    if (isPausedChanged || selectedFrameChanged || frameScopesChanged) {
      this.setState({ scopes: null });
      this.updateScopes(nextProps.why, nextProps.selectedFrame, nextProps.frameScopes);
    }
  }

  renderScopesList() {
    const { originalScopesUnavailable, selectedFrame } = this.props;
    const { scopes } = this.state;

    scopes!.forEach((s, i) => {
      // TODO STOP MUTATING FRONTS!
      // @ts-expect-error we're mutating these fronts - bad!
      s.path = `scope${selectedFrame?.id}.${i}`;
    });

    return (
      <Redacted className="pane scopes-list" data-test-name="ScopesList">
        {originalScopesUnavailable ? (
          <div className="warning">The variables could not be mapped to their original names</div>
        ) : null}
        <NewObjectInspector roots={scopes!} />
      </Redacted>
    );
  }

  render() {
    const { currentTime, enterFocusMode, isCurrentTimeInLoadedRegion, isErrored, isLoading } =
      this.props;
    const { scopes } = this.state;

    if (!isCurrentTimeInLoadedRegion) {
      return (
        <div className="pane">
          <div className="pane-info empty">
            Scope is unavailable because it is outside{" "}
            <span className="cursor-pointer underline" onClick={enterFocusMode}>
              your debugging window
            </span>
            .
          </div>
        </div>
      );
    }

    if (isErrored) {
      return (
        <div className="pane">
          <div className="pane-info">Error trying to pause at {formatTimestamp(currentTime)}</div>
        </div>
      );
    }
    if (isLoading) {
      return (
        <div className="pane">
          <div className="pane-info">Loading…</div>
        </div>
      );
    }
    if (!scopes || scopes.length === 0) {
      return (
        <div className="pane">
          <div className="pane-info empty">Not paused at a point with any scopes</div>
        </div>
      );
    }

    return <div className="scopes-content">{this.renderScopesList()}</div>;
  }
}

const mapStateToProps = (state: UIState) => {
  const cx = getThreadContext(state);
  const selectedFrame = getSelectedFrame(state);
  const frameScope = getFrameScope(state, selectedFrame?.id);
  const pauseErrored = state.pause.pauseErrored;
  const pauseLoading = state.pause.pauseLoading;
  const { scope, pending, originalScopesUnavailable } = frameScope || {
    scope: null,
    pending: false,
    originalScopesUnavailable: false,
  };
  const framesLoading = getFramesLoading(state);

  return {
    currentTime: getCurrentTime(state),
    cx,
    isCurrentTimeInLoadedRegion: isCurrentTimeInLoadedRegion(state),
    frameScopes: scope,
    isErrored: pauseErrored,
    isLoading: pending || framesLoading || pauseLoading,
    originalScopesUnavailable,
    selectedFrame,
    why: getPauseReason(state),
  };
};

const connector = connect(mapStateToProps, {
  enterFocusMode: enterFocusModeAction,
});
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Scopes);
