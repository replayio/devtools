/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import React, { PureComponent } from "react";
import { showMenu } from "devtools/shared/contextmenu";
import { connect } from "../../utils/connect";
import actions from "../../actions";
import { features } from "../../utils/prefs";

import {
  getSelectedFrame,
  getFrameScope,
  getPauseReason,
  getThreadContext,
  getLastExpandedScopes,
} from "../../selectors";
import { getScopes } from "../../utils/pause/scopes";
import { getScopeItemPath } from "../../utils/pause/scopes/utils";
import { trackEvent } from "ui/utils/telemetry";
import { Redacted } from "ui/components/Redacted";

const { objectInspector } = require("devtools/packages/devtools-reps");

const ObjectInspector = objectInspector.ObjectInspector.default;

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
      isLoading,
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

    if (scopes && scopes.length > 0 && !isLoading) {
      const roots = scopes.map((s, i) => ({
        path: `scope${selectedFrame?.id}.${i}`,
        name: s.name,
        contents: s.contents,
      }));
      return (
        <Redacted className="pane scopes-list">
          {originalScopesUnavailable ? (
            <div className="warning">The variables could not be mapped to their original names</div>
          ) : null}
          <ObjectInspector
            roots={roots}
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

    let stateText = "";
    if (isLoading) {
      stateText = "Loading\u2026";
    }

    return (
      <div className="pane scopes-list">
        <div className="pane-info">{stateText}</div>
      </div>
    );
  }

  render() {
    return <div className="scopes-content">{this.renderScopesList()}</div>;
  }
}

const mapStateToProps = state => {
  const cx = getThreadContext(state);
  const selectedFrame = getSelectedFrame(state);
  const frameScope = getFrameScope(state, selectedFrame?.id);
  const { scope, pending, originalScopesUnavailable } = frameScope || {
    scope: null,
    pending: false,
    originalScopesUnavailable: false,
  };

  return {
    cx,
    selectedFrame,
    isLoading: pending,
    why: getPauseReason(state),
    frameScopes: scope,
    originalScopesUnavailable,
    expandedScopes: getLastExpandedScopes(state),
  };
};

export default connect(mapStateToProps, {
  openLink: actions.openLink,
  openElementInInspector: actions.openElementInInspectorCommand,
  highlightDomElement: actions.highlightDomElement,
  unHighlightDomElement: actions.unHighlightDomElement,
  setExpandedScope: actions.setExpandedScope,
  addWatchpoint: actions.addWatchpoint,
  removeWatchpoint: actions.removeWatchpoint,
})(Scopes);
