import React, { useState } from "react";
import { Workspace } from "ui/types";
import { Dropdown, DropdownItem } from "../Library/LibraryDropdown";
import PortalDropdown from "../shared/PortalDropdown";
import { SelectorIcon } from "@heroicons/react/solid";

const TeamSelectButton = ({ selectedWorkspaceName }: { selectedWorkspaceName: string }) => {
  return (
    <div className="bg-white relative w-full border border-textFieldBorder rounded-md shadow-sm pl-2.5 pr-8 py-1.5 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-primaryAccent focus:border-primaryAccentHover">
      <span className="block truncate">{selectedWorkspaceName}</span>
      <span className="absolute inset-y-0 right-0 flex items-center pr-1.5 pointer-events-none">
        <SelectorIcon className="h-4 w-4 text-textFieldBorder" aria-hidden="true" />
      </span>
    </div>
  );
};

export default function TeamSelect({
  workspaces,
  selectedWorkspaceId,
  handleWorkspaceSelect,
}: {
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
  handleWorkspaceSelect: (id: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const personalWorkspace = { id: null, name: "My Library" };
  const displayedWorkspaces = [personalWorkspace, ...workspaces].sort();

  const handleSelect = (workspace: Workspace | typeof personalWorkspace) => {
    handleWorkspaceSelect(workspace.id);
    setExpanded(false);
  };

  const selectedWorkspaceName = displayedWorkspaces.find(w => w.id === selectedWorkspaceId)!.name;
  const button = <TeamSelectButton selectedWorkspaceName={selectedWorkspaceName} />;

  return (
    <PortalDropdown
      buttonContent={button}
      setExpanded={setExpanded}
      expanded={expanded}
      buttonStyle=""
      distance={0}
      position="bottom-right"
    >
      <Dropdown widthClass="w-64">
        <div className="max-h-48 overflow-auto">
          {displayedWorkspaces.map(w => (
            <DropdownItem onClick={() => handleSelect(w)} key={w.id}>
              {w.name}
            </DropdownItem>
          ))}
        </div>
      </Dropdown>
    </PortalDropdown>
  );
}
