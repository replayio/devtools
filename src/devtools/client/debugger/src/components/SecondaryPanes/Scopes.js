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

class Scopes extends PureComponent {
  constructor(props) {
    const { why, selectedFrame, frameScopes } = props;

    super(props);

    this.state = {
      scopes: getScopes(why, selectedFrame, frameScopes),
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { cx, selectedFrame, frameScopes } = this.props;
    const isPausedChanged = cx.isPaused !== nextProps.cx.isPaused;
    const selectedFrameChanged = selectedFrame !== nextProps.selectedFrame;
    const frameScopesChanged = frameScopes !== nextProps.frameScopes;

    if (isPausedChanged || selectedFrameChanged || frameScopesChanged) {
      this.setState({
        scopes: getScopes(nextProps.why, nextProps.selectedFrame, nextProps.frameScopes),
      });
    }
  }

  onContextMenu = (event, item) => {
    const { addWatchpoint, removeWatchpoint } = this.props;

    if (!features.watchpoints || !item.parent || !item.contents.configurable) {
      return;
    }

    if (!item.contents || item.contents.watchpoint) {
      const removeWatchpointLabel = "Remove watchpoint";

      const removeWatchpointItem = {
        id: "node-menu-remove-watchpoint",
        label: removeWatchpointLabel,
        disabled: false,
        click: () => removeWatchpoint(item),
      };

      const menuItems = [removeWatchpointItem];
      return showMenu(event, menuItems);
    }

    const addSetWatchpointLabel = "Property set";
    const addGetWatchpointLabel = "Property get";
    const watchpointsSubmenuLabel = "Break on…";

    const addSetWatchpointItem = {
      id: "node-menu-add-set-watchpoint",
      label: addSetWatchpointLabel,
      disabled: false,
      click: () => addWatchpoint(item, "set"),
    };

    const addGetWatchpointItem = {
      id: "node-menu-add-get-watchpoint",
      label: addGetWatchpointLabel,
      disabled: false,
      click: () => addWatchpoint(item, "get"),
    };

    const watchpointsSubmenuItem = {
      id: "node-menu-watchpoints",
      label: watchpointsSubmenuLabel,
      disabled: false,
      click: () => addWatchpoint(item, "set"),
      submenu: [addSetWatchpointItem, addGetWatchpointItem],
    };

    const menuItems = [watchpointsSubmenuItem];
    showMenu(event, menuItems);
  };

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
    return (
      <Redacted className="pane scopes-list">
        {originalScopesUnavailable ? (
          <div className="warning">The variables could not be mapped to their original names</div>
        ) : null}
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
          onContextMenu={this.onContextMenu}
          setExpanded={(path, expand) => {
            trackEvent("scopes.set_expanded");
            setExpandedScope(cx, path, expand);
          }}
          initiallyExpanded={initiallyExpanded}
          renderItemActions={this.renderWatchpointButton}
        />
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
  openElementInInspector: actions.openElementInInspectorCommand,
  highlightDomElement,
  unHighlightDomElement,
  setExpandedScope: actions.setExpandedScope,
  addWatchpoint: actions.addWatchpoint,
  removeWatchpoint: actions.removeWatchpoint,
})(Scopes);
