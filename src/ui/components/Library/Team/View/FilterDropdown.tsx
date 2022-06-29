import { MouseEvent, useContext, useState } from "react";
import PortalDropdown from "../../../shared/PortalDropdown";
import { useFeature } from "ui/hooks/settings";
import { Dropdown, DropdownDivider, DropdownItem } from "../../LibraryDropdown";
import { View, ViewContext } from "./ViewContext";

const daysInSeconds = (days: number) => 1000 * 60 * 60 * 24 * days;

const viewLabels = {
  recordings: "Recordings",
  runs: "Test Runs",
  results: "Test Results",
};

export function FilterDropdown() {
  const { view, setView } = useContext(ViewContext);
  const [expanded, setExpanded] = useState(false);
  const { value: testSupport } = useFeature("testSupport");

  const setStringAndCollapseDropdown = (str: string) => {
    // setAppliedText(str);
    setExpanded(false);
  };
  const handleCreatedSince = (days: number) => {
    const secondsAgo = daysInSeconds(days);
    const isoString = new Date(new Date().getTime() - secondsAgo).toISOString().substr(0, 10);

    return setStringAndCollapseDropdown(`created:${isoString}`);
  };
  const handleSetView = (view: View, e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    console.log({ view });
    setView(view);
    setExpanded(false);
  };

  const buttonLabel = viewLabels[view];

  const button = (
    <div className="flex space-x-2 rounded-md border border-textFieldBorder bg-themeTextFieldBgcolor px-2.5 py-1.5 text-sm text-themeTextFieldColor">
      <div className="text-sm">{buttonLabel}</div>
      <div className="text-sm material-icons">expand_more</div>
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
            <DropdownItem onClick={e => handleSetView("runs", e)}>Show Runs</DropdownItem>
            <DropdownItem onClick={e => handleSetView("results", e)}>Show Results</DropdownItem>
          </>
        ) : null}
      </Dropdown>
    </PortalDropdown>
  );
}
