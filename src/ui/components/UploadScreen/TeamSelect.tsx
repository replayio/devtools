import { SelectorIcon } from "@heroicons/react/solid";
import React from "react";
import { useGetUserInfo } from "ui/hooks/users";
import { Workspace } from "ui/types";

import { Dropdown, DropdownItem } from "../Library/LibraryDropdown";

import { personalWorkspace } from "./libraryConstants";

const TeamSelectButton = ({ selectedWorkspaceName }: { selectedWorkspaceName: string }) => {
  return (
    <div className="relative w-full cursor-default rounded-md border border-textFieldBorder bg-jellyfishBgcolor py-1.5 pl-2.5 pr-8 text-left shadow-sm focus:border-primaryAccentHover focus:outline-none focus:ring-1 focus:ring-primaryAccent">
      <span className="block truncate">{selectedWorkspaceName}</span>
      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5">
        <SelectorIcon className="h-4 w-4 text-textFieldBorder" aria-hidden="true" />
      </span>
    </div>
  );
};

interface DisplayedWorkspace {
  id: string;
  name: string;
}

export default function TeamSelect({
  workspaces,
  selectedWorkspaceId,
  handleWorkspaceSelect,
}: {
  workspaces: Workspace[];
  selectedWorkspaceId: string;
  handleWorkspaceSelect: (id: string) => void;
}) {
  const userInfo = useGetUserInfo();
  let displayedWorkspaces: DisplayedWorkspace[] = [...workspaces].sort();

  if (userInfo.features.library) {
    displayedWorkspaces = [personalWorkspace, ...displayedWorkspaces];
  }

  const handleSelect = (workspace: DisplayedWorkspace) => {
    handleWorkspaceSelect(workspace.id);
  };

  const selectedWorkspace =
    displayedWorkspaces.find(w => w.id === selectedWorkspaceId) || displayedWorkspaces[0];
  const selectedWorkspaceName = selectedWorkspace.name;
  const button = <TeamSelectButton selectedWorkspaceName={selectedWorkspaceName} />;

  return (
    <Dropdown trigger={button} widthClass="w-64" fontSizeClass="text-base">
      <div className="max-h-48 overflow-auto">
        {displayedWorkspaces.map(workspace => (
          <DropdownItem onClick={() => handleSelect(workspace)} key={workspace.id}>
            {workspace.name}
          </DropdownItem>
        ))}
      </div>
    </Dropdown>
  );
}
