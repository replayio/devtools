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
    <label className="flex py-1 items-center select-none" htmlFor={id}>
      <div className="flex flex-row flex-grow space-x-2 items-center">
        <Checkbox id={id} checked={selected} className="m-0" onChange={onClick} />
        <span className="whitespace-pre overflow-hidden overflow-ellipsis flex-grow">
          {children}
        </span>
      </div>
    </label>
  );
};

function ConsoleSettings({ filters, filterToggle, timestampsToggle, timestampsVisible }) {
  return (
    <div className="flex flex-col">
      <ToggleRow
        onClick={() => {
          trackEvent("console.settings.toggle_node_modules");
          filterToggle(FILTERS.NODEMODULES);
        }}
        selected={!filters[FILTERS.NODEMODULES]}
        id="hide-node-modules"
      >
        Hide Node Modules
      </ToggleRow>
      <ToggleRow
        onClick={() => {
          trackEvent("console.settings.toggle_timestamp");
          timestampsToggle();
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
    filterToggle: actions.filterToggle,
    timestampsToggle: actions.timestampsToggle,
  }
)(ConsoleSettings);
