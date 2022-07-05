import { useContext, useState } from "react";
import PortalDropdown from "../../../shared/PortalDropdown";
import { Dropdown, DropdownDivider, DropdownItem } from "../../LibraryDropdown";
import { View, ViewContext } from "./ViewContextRoot";
import { useGetWorkspace } from "ui/hooks/workspaces";
import { useGetTeamIdFromRoute } from "ui/components/Library/Team/utils";

const daysInSeconds = (days: number) => 1000 * 60 * 60 * 24 * days;

const viewLabels = {
  recordings: "Recordings",
  runs: "Test Runs",
  results: "Test Results",
};

export function ViewOptions({ collapseDropdown }: { collapseDropdown: () => void }) {
  const workspaceId = useGetTeamIdFromRoute();
  const { setView, view } = useContext(ViewContext);
  const { workspace } = useGetWorkspace(workspaceId);

  const handleSetView = (view: View) => {
    collapseDropdown();
    setView(view);
  };

  // Don't show the options if the workspace is not a test workspace.
  if (!workspace?.isTest) {
    return null;
  }

  return (
    <>
      <DropdownDivider />
      {view === "results" ? (
        <DropdownItem onClick={() => handleSetView("runs")}>Show Test Runs</DropdownItem>
      ) : (
        <DropdownItem onClick={() => handleSetView("results")}>Show Test Results</DropdownItem>
      )}
    </>
  );
}
export function FilterDropdown() {
  const [expanded, setExpanded] = useState(false);
  const { view } = useContext(ViewContext);
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
        {view === "recordings" ? (
          <>
            <DropdownItem onClick={() => setStringAndCollapseDropdown("")}>
              All Replays
            </DropdownItem>
            <DropdownItem onClick={() => handleCreatedSince(7)}>Last 7 days</DropdownItem>
            <DropdownItem onClick={() => setStringAndCollapseDropdown("target:node")}>
              Node replays
            </DropdownItem>
          </>
        ) : null}
        <ViewOptions collapseDropdown={() => setExpanded(false)} />
      </Dropdown>
    </PortalDropdown>
  );
}
