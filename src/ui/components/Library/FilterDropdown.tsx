import { useState } from "react";

import PortalDropdown from "../shared/PortalDropdown";
import { useFeature } from "ui/hooks/settings";
import { Dropdown, DropdownDivider, DropdownItem } from "./LibraryDropdown";
import { View } from "./useFilters";

const daysInSeconds = (days: number) => 1000 * 60 * 60 * 24 * days;

export function FilterDropdown({
  setAppliedText,
  setView,
}: {
  setAppliedText: (str: string) => void;
  setView: (view: View) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { value: testSupport } = useFeature("testSupport");

  const setStringAndCollapseDropdown = (str: string) => {
    setAppliedText(str);
    setView("recordings");
    setExpanded(false);
  };
  const handleCreatedSince = (days: number) => {
    const secondsAgo = daysInSeconds(days);
    const isoString = new Date(new Date().getTime() - secondsAgo).toISOString().substr(0, 10);

    return setStringAndCollapseDropdown(`created:${isoString}`);
  };
  const handleSetView = (view: View) => {
    setExpanded(false);
    setView(view);
  };

  const button = (
    <div className="text-sm flex border border-textFieldBorder bg-themeTextFieldBgcolor px-2.5 py-1.5 text-themeTextFieldColor rounded-md space-x-2">
      <div className="text-sm">Filter</div>
      <div className="material-icons text-sm">expand_more</div>
    </div>
  );

  return (
    <PortalDropdown
      buttonContent={button}
      setExpanded={setExpanded}
      expanded={expanded}
      position="top-right"
      distance={0}
    >
      <Dropdown menuItemsClassName="z-50">
        <DropdownItem onClick={() => setStringAndCollapseDropdown("")}>All Replays</DropdownItem>
        <DropdownItem onClick={() => handleCreatedSince(7)}>Last 7 days</DropdownItem>
        <DropdownItem onClick={() => setStringAndCollapseDropdown("target:node")}>
          Node replays
        </DropdownItem>
        {testSupport ? (
          <>
            <DropdownDivider />
            <DropdownItem onClick={() => handleSetView("recordings")}>
              Show Recordings View
            </DropdownItem>
            <DropdownItem onClick={() => handleSetView("tests")}>Show Tests View</DropdownItem>
            <DropdownItem onClick={() => handleSetView("test-runs")}>
              Show Test Runs View
            </DropdownItem>
          </>
        ) : null}
      </Dropdown>
    </PortalDropdown>
  );
}
