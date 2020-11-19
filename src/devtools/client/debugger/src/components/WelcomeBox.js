/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import React, { Component } from "react";

import { connect } from "../utils/connect";

import actions from "../actions";
import { getPaneCollapse } from "../selectors";
import { formatKeyShortcut } from "../utils/text";

import "./WelcomeBox.css";

export class WelcomeBox extends Component {
  render() {
    const searchSourcesShortcut = formatKeyShortcut("CmdOrCtrl+P");

    const searchProjectShortcut = formatKeyShortcut("CmdOrCtrl+Shift+F");

    const allShortcutsShortcut = formatKeyShortcut("CmdOrCtrl+/");

    const allShortcutsLabel = "Show all shortcuts";
    const searchSourcesLabel = "%S Go to file".substring(2);
    const searchProjectLabel = "%S Find in files".substring(2);
    const { setActiveSearch, openQuickOpen, toggleShortcutsModal } = this.props;

    return (
      <div className="welcomebox">
        <div className="alignlabel">
          <div className="shortcutFunction">
            <p
              className="welcomebox__searchSources"
              role="button"
              tabIndex="0"
              onClick={() => openQuickOpen()}
            >
              <span className="shortcutKey">{searchSourcesShortcut}</span>
              <span className="shortcutLabel">{searchSourcesLabel}</span>
            </p>
            <p
              className="welcomebox__searchProject"
              role="button"
              tabIndex="0"
              onClick={setActiveSearch.bind(null, "project")}
            >
              <span className="shortcutKey">{searchProjectShortcut}</span>
              <span className="shortcutLabel">{searchProjectLabel}</span>
            </p>
            <p
              className="welcomebox__allShortcuts"
              role="button"
              tabIndex="0"
              onClick={() => toggleShortcutsModal()}
            >
              <span className="shortcutKey">{allShortcutsShortcut}</span>
              <span className="shortcutLabel">{allShortcutsLabel}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  endPanelCollapsed: getPaneCollapse(state, "end"),
});

export default connect(mapStateToProps, {
  togglePaneCollapse: actions.togglePaneCollapse,
  setActiveSearch: actions.setActiveSearch,
  openQuickOpen: actions.openQuickOpen,
})(WelcomeBox);
