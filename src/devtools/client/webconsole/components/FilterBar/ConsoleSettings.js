/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import React from "react";
import Checkbox from "ui/components/shared/Forms/Checkbox";
const { connect } = require("react-redux");
const { getAllUi } = require("devtools/client/webconsole/selectors/ui");

const { actions } = require("ui/actions");
const { selectors } = require("ui/reducers");
const { trackEvent } = require("ui/utils/telemetry");

const { FILTERS } = require("devtools/client/webconsole/constants");

export const ToggleRow = ({ children, selected, onClick, id }) => {
  return (
    <label className="flex select-none items-center py-0.5" htmlFor={id}>
      <div className="flex flex-grow flex-row items-center space-x-2">
        <Checkbox id={id} checked={selected} className="m-0" onChange={onClick} />
        <span className="flex-grow overflow-hidden overflow-ellipsis whitespace-pre">
          {children}
        </span>
      </div>
    </label>
  );
};

function ConsoleSettings({ filters, filterToggled, toggleTimestamps, timestampsVisible }) {
  return (
    <div className="flex flex-col">
      <ToggleRow
        onClick={() => {
          trackEvent("console.settings.toggle_node_modules");
          filterToggled(FILTERS.NODEMODULES);
        }}
        selected={!filters[FILTERS.NODEMODULES]}
        id="hide-node-modules"
      >
        Hide Node Modules
      </ToggleRow>
      <ToggleRow
        onClick={() => {
          trackEvent("console.settings.toggle_timestamp");
          toggleTimestamps();
        }}
        selected={timestampsVisible}
        id="show-timestamps"
      >
        Show Timestamps
      </ToggleRow>
    </div>
  );
}

export default connect(
  state => ({
    filters: selectors.getAllFilters(state),
    timestampsVisible: getAllUi(state).timestampsVisible,
  }),
  {
    filterToggled: actions.filterToggled,
    toggleTimestamps: actions.toggleTimestamps,
  }
)(ConsoleSettings);
