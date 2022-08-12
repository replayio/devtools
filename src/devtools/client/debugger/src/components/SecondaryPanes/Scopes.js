/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import {
  highlightDomElement,
  unHighlightDomElement,
} from "devtools/client/webconsole/actions/toolbox";
import { ObjectInspector } from "devtools/packages/devtools-reps";
import { showMenu } from "devtools/shared/contextmenu";
import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { enterFocusMode as enterFocusModeAction } from "ui/actions/timeline";
import { Redacted } from "ui/components/Redacted";
import { isCurrentTimeInLoadedRegion } from "ui/reducers/app";
import { getCurrentTime } from "ui/reducers/timeline";
import { trackEvent } from "ui/utils/telemetry";
import { formatTimestamp } from "ui/utils/time";
import { prefs as prefsService } from "devtools/shared/services";

import actions from "../../actions";
import {
  getSelectedFrame,
  getFrameScope,
  getPauseReason,
  getThreadContext,
  getLastExpandedScopes,
  getFramesLoading,
} from "../../selectors";
import { getScopes } from "../../utils/pause/scopes";
import { getScopeItemPath } from "../../utils/pause/scopes/utils";
import { features } from "../../utils/prefs";
import NewObjectInspector from "./NewObjectInspector";

class Scopes extends PureComponent {
  constructor(props) {
    const { why, selectedFrame, frameScopes } = props;

    super(props);

    this.state = { scopes: null };
    this.updateScopes(why, selectedFrame, frameScopes);
  }

  async updateScopes(why, selectedFrame, frameScopes) {
    const scopes = getScopes(why, selectedFrame, frameScopes);
    if (scopes) {
      const scopesToLoad = scopes.filter(scope => scope.type === "value" && !scope.loaded);
      await Promise.all(scopesToLoad.map(scope => scope.contents.load()));
      this.setState({ scopes });
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { cx, selectedFrame, frameScopes } = this.props;
    const isPausedChanged = cx.isPaused !== nextProps.cx.isPaused;
    const selectedFrameChanged = selectedFrame !== nextProps.selectedFrame;
    const frameScopesChanged = frameScopes !== nextProps.frameScopes;

    if (isPausedChanged || selectedFrameChanged || frameScopesChanged) {
      this.setState({ scopes: null });
      this.updateScopes(nextProps.why, nextProps.selectedFrame, nextProps.frameScopes);
    }
  }

  renderWatchpointButton = item => {
    return null;

    const { removeWatchpoint } = this.props;

    if (!item || !item.contents || !item.contents.watchpoint || typeof L10N === "undefined") {
      return null;
    }

    const watchpoint = item.contents.watchpoint;
    return (
      <button
        className={`remove-${watchpoint}-watchpoint`}
        title={"Remove watchpoint"}
        onClick={() => removeWatchpoint(item)}
      />
    );
  };

  renderScopesList() {
    const {
      cx,
      openLink,
      openElementInInspector,
      highlightDomElement,
      unHighlightDomElement,
      setExpandedScope,
      expandedScopes,
      selectedFrame,
      originalScopesUnavailable,
    } = this.props;
    const { scopes } = this.state;

    function initiallyExpanded(item) {
      return expandedScopes.some(path => path == getScopeItemPath(item));
    }

    scopes.forEach((s, i) => {
      s.path = `scope${selectedFrame?.id}.${i}`;
    });

    const enableNewComponentArchitecture = prefsService.getBoolPref(
      "devtools.features.enableNewComponentArchitecture"
    );
    let objectInspector = null;
    if (enableNewComponentArchitecture) {
      objectInspector = <NewObjectInspector roots={scopes} />;
    } else {
      objectInspector = (
        <ObjectInspector
          roots={scopes}
          autoExpandAll={false}
          autoExpandDepth={1}
          disableWrap={true}
          dimTopLevelWindow={true}
          openLink={openLink}
          onDOMNodeClick={grip => openElementInInspector(grip)}
          onInspectIconClick={grip => openElementInInspector(grip)}
          onDOMNodeMouseOver={grip => highlightDomElement(grip)}
          onDOMNodeMouseOut={grip => unHighlightDomElement(grip)}
          setExpanded={(path, expand) => {
            trackEvent("scopes.set_expanded");
            setExpandedScope(cx, path, expand);
          }}
          initiallyExpanded={initiallyExpanded}
          renderItemActions={this.renderWatchpointButton}
        />
      );
    }

    return (
      <Redacted className="pane scopes-list">
        {originalScopesUnavailable ? (
          <div className="warning">The variables could not be mapped to their original names</div>
        ) : null}
        {objectInspector}
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

const mapStateToProps = state => {
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
    expandedScopes: getLastExpandedScopes(state),
    isCurrentTimeInLoadedRegion: isCurrentTimeInLoadedRegion(state),
    frameScopes: scope,
    isErrored: pauseErrored,
    isLoading: pending || framesLoading || pauseLoading,
    originalScopesUnavailable,
    selectedFrame,
    why: getPauseReason(state),
  };
};

export default connect(mapStateToProps, {
  enterFocusMode: enterFocusModeAction,
  openLink: actions.openLink,
  openElementInInspector: actions.openNodeInInspector,
  highlightDomElement,
  unHighlightDomElement,
  setExpandedScope: actions.setExpandedScope,
  removeWatchpoint: actions.removeWatchpoint,
})(Scopes);
