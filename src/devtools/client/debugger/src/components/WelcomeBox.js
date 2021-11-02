/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React, { Component } from "react";
import { connect } from "../utils/connect";
import actions from "../actions";
import { formatKeyShortcut } from "../utils/text";
import { useGetUserSettings } from "ui/hooks/settings";

// import "./WelcomeBox.css";

function WelcomeBox({ setActiveSearch, openQuickOpen, toggleShortcutsModal }) {
  const { userSettings, loading } = useGetUserSettings();
  if (loading) {
    return null;
  }

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
            <span className="shortcutKey">{formatKeyShortcut("CmdOrCtrl+p")}</span>
            <span className="shortcutLabel">{"%S Go to file".substring(2)}</span>
          </p>

          {userSettings.enableGlobalSearch && (
            <p
              className="welcomebox__searchSources"
              role="button"
              tabIndex="0"
              onClick={() => openQuickOpen("@", true)}
            >
              <span className="shortcutKey">{formatKeyShortcut("CmdOrCtrl+o")}</span>
              <span className="shortcutLabel">{"%S Search functions".substring(2)}</span>
            </p>
          )}
          <p
            className="welcomebox__searchProject"
            role="button"
            tabIndex="0"
            onClick={setActiveSearch.bind(null, "project")}
          >
            <span className="shortcutKey">{formatKeyShortcut("CmdOrCtrl+Shift+f")}</span>
            <span className="shortcutLabel">{"%S Find in files".substring(2)}</span>
          </p>
          <p
            className="welcomebox__allShortcuts"
            role="button"
            tabIndex="0"
            onClick={() => toggleShortcutsModal()}
          >
            <span className="shortcutKey">{formatKeyShortcut("CmdOrCtrl+/")}</span>
            <span className="shortcutLabel">{"Show all shortcuts"}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default connect(() => ({}), {
  setActiveSearch: actions.setActiveSearch,
  openQuickOpen: actions.openQuickOpen,
})(WelcomeBox);
