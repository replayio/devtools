import React, { FC } from "react";
import FilterSettings from "devtools/client/webconsole/components/FilterBar/FilterSettings";
import ConsoleSettings from "devtools/client/webconsole/components/FilterBar/ConsoleSettings";
import EventListeners from "devtools/client/debugger/src/components/SecondaryPanes/EventListeners";
import { useSelector } from "react-redux";
import { getConsoleFilterDrawerExpanded } from "ui/reducers/layout";

export const FilterDrawer: FC = () => {
  const expanded = useSelector(getConsoleFilterDrawerExpanded);

  if (!expanded) {
    return null;
  }

  return (
    <div className="flex flex-col bg-bodyBgcolor">
      <div
        className="flex flex-grow flex-col space-y-2 overflow-y-auto border-r border-themeBorder py-2"
        style={{ width: "var(--console-drawer-width)" }}
      >
        <div className="px-2">
          <FilterSettings />
        </div>
        <div className="w-full border-b border-themeBorder" />
        <div className="flex-grow px-2">
          <EventListeners />
        </div>
        <div className="w-full border-b border-themeBorder" />
        <div className="px-2">
          <ConsoleSettings />
        </div>
      </div>
    </div>
  );
};
