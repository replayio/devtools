import { useContext, useState } from "react";

import PortalDropdown from "../shared/PortalDropdown";
import { useFeature } from "ui/hooks/settings";
import { Dropdown, DropdownDivider, DropdownItem } from "./LibraryDropdown";
import { LibraryContext, View } from "./useFilters";
import { getWorkspaceId } from "ui/actions/app";
import { useGetWorkspace } from "ui/hooks/workspaces";
import { useAppSelector } from "ui/setup/hooks";

const daysInSeconds = (days: number) => 1000 * 60 * 60 * 24 * days;

export function ViewOptions({
  collapseDropdown,
  workspaceId,
}: {
  collapseDropdown: () => void;
  workspaceId: string;
}) {
  const { setView } = useContext(LibraryContext);
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
      <DropdownItem onClick={() => handleSetView("recordings")}>Show Recordings</DropdownItem>
      <DropdownItem onClick={() => handleSetView("test-runs")}>Show Runs</DropdownItem>
    </>
  );
}

export function FilterDropdown() {
  const { setAppliedText, setView, view } = useContext(LibraryContext);
  const [expanded, setExpanded] = useState(false);
  const currentWorkspaceId = useAppSelector(getWorkspaceId);

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

  const buttonLabel = view === "recordings" ? "Filters" : "Test Runs";

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
        {currentWorkspaceId ? (
          <ViewOptions
            collapseDropdown={() => setExpanded(false)}
            workspaceId={currentWorkspaceId}
          />
        ) : null}
      </Dropdown>
    </PortalDropdown>
  );
}
