import { useContext, useState } from "react";
import PortalDropdown from "../../../shared/PortalDropdown";
import { Dropdown, DropdownDivider, DropdownItem } from "../../LibraryDropdown";
import { View, ViewContext } from "./ViewContext";
import { getWorkspaceId } from "ui/actions/app";
import { useAppSelector } from "ui/setup/hooks";
import { useGetWorkspace } from "ui/hooks/workspaces";
import { useFeature } from "ui/hooks/settings";

const daysInSeconds = (days: number) => 1000 * 60 * 60 * 24 * days;

const viewLabels = {
  recordings: "Recordings",
  runs: "Test Runs",
  results: "Test Results",
};

export function ViewOptions({ collapseDropdown }: { collapseDropdown: () => void }) {
  const workspaceId = useAppSelector(getWorkspaceId);
  const { setView } = useContext(ViewContext);
  const { workspace } = useGetWorkspace(workspaceId);
  const { value: testSupport } = useFeature("testSupport");

  const handleSetView = (view: View) => {
    collapseDropdown();
    setView(view);
  };

  // Don't show the options if the feature flag is off, or the workspace is not a test workspace.
  if (!testSupport || !workspace?.isTest) {
    return null;
  }

  return (
    <>
      <DropdownDivider />
      <DropdownItem onClick={() => handleSetView("runs")}>Show Runs</DropdownItem>
      <DropdownItem onClick={() => handleSetView("results")}>Show Results</DropdownItem>
    </>
  );
}
export function FilterDropdown() {
  const [expanded, setExpanded] = useState(false);
  const {view} = useContext(ViewContext);
  const buttonLabel = viewLabels[view];
  const setStringAndCollapseDropdown = (str: string) => {
    setExpanded(false);
  };
  const handleCreatedSince = (days: number) => {
    const secondsAgo = daysInSeconds(days);
    const isoString = new Date(new Date().getTime() - secondsAgo).toISOString().substr(0, 10);

    return setStringAndCollapseDropdown(`created:${isoString}`);
  };

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
        <ViewOptions collapseDropdown={() => setExpanded(false)} />
      </Dropdown>
    </PortalDropdown>
  );
}
