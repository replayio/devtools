/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React, { Component } from "react";
import { connect } from "../utils/connect";
import actions from "../actions";
import { formatKeyShortcut } from "../utils/text";
import { useGetUserSettings } from "ui/hooks/settings";
import { setSelectedPrimaryPanel } from "ui/actions/app";

function WelcomeBox({
  setActiveSearch,
  openQuickOpen,
  toggleShortcutsModal,
  setSelectedPrimaryPanel,
}) {
  const { userSettings, loading } = useGetUserSettings();
  if (loading) {
    return null;
  }

  return (
    <div className="welcomebox">
      <div className="alignlabel">
        <div className="shortcutFunction">
          <div
            className="welcomebox__searchSources"
            role="button"
            tabIndex="0"
            onClick={() => openQuickOpen()}
          >
            <span className="shortcutLabel">{"%S Go to file".substring(2)}</span>
            <span className="shortcutKey">{formatKeyShortcut("CmdOrCtrl+P")}</span>
          </div>

          {userSettings.enableGlobalSearch && (
            <div
              className="welcomebox__searchSources"
              role="button"
              tabIndex="0"
              onClick={() => openQuickOpen("@", true)}
            >
              <span className="shortcutLabel">{"%S Search functions".substring(2)}</span>
              <span className="shortcutKey">{formatKeyShortcut("CmdOrCtrl+O")}</span>
            </div>
          )}
          <div
            className="welcomebox__searchProject"
            role="button"
            tabIndex="0"
            onClick={() => setSelectedPrimaryPanel("search")}
          >
            <span className="shortcutLabel">{"%S Find in files".substring(2)}</span>
            <span className="shortcutKey">{formatKeyShortcut("CmdOrCtrl+Shift+F")}</span>
          </div>
          <div
            className="welcomebox__allShortcuts"
            role="button"
            tabIndex="0"
            onClick={() => toggleShortcutsModal()}
          >
            <span className="shortcutLabel">{"Show all shortcuts"}</span>
            <span className="shortcutKey">{formatKeyShortcut("CmdOrCtrl+/")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default connect(() => ({}), {
  setActiveSearch: actions.setActiveSearch,
  openQuickOpen: actions.openQuickOpen,
  setSelectedPrimaryPanel,
})(WelcomeBox);
