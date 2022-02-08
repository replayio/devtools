import React, { useState } from "react";
import FilterSettings from "devtools/client/webconsole/components/FilterBar/FilterSettings";
import ConsoleSettings from "devtools/client/webconsole/components/FilterBar/ConsoleSettings";
import EventListeners from "devtools/client/debugger/src/components/SecondaryPanes/EventListeners";
import { getAllUi } from "../selectors/ui";
import { UIState } from "ui/state";
import { connect, ConnectedProps } from "react-redux";

function FilterDrawer({ collapseFilterDrawer }: PropsFromRedux) {
  if (collapseFilterDrawer) {
    return null;
  }
  return (
    <div className="flex flex-col bg-white">
      <div
        className="flex flex-grow flex-col space-y-2 overflow-y-auto border-r border-gray-300 py-2"
        style={{ width: "var(--console-drawer-width)" }}
      >
        <div className="px-2">
          <FilterSettings />
        </div>
        <div className="w-full border-b border-gray-300" />
        <div className="flex-grow px-2">
          <EventListeners />
        </div>
        <div className="w-full border-b border-gray-300" />
        <div className="px-2">
          <ConsoleSettings />
        </div>
      </div>
    </div>
  );
}

const connector = connect((state: UIState) => ({
  collapseFilterDrawer: getAllUi(state).collapseFilterDrawer,
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(FilterDrawer);
