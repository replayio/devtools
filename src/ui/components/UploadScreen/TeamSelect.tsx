import { SelectorIcon } from "@heroicons/react/solid";
import React, { useState } from "react";

import { Workspace } from "shared/graphql/types";
import { useGetUserInfo } from "ui/hooks/users";
import { subscriptionExpired } from "ui/utils/workspace";

import PortalDropdown from "../shared/PortalDropdown";
import { Dropdown, DropdownItem } from "../shared/SharingModal/LibraryDropdown";
import { personalWorkspace } from "./libraryConstants";

const TeamSelectButton = ({
  selectedWorkspaceName,
}: {
  selectedWorkspaceName: string | undefined;
}) => {
  return (
    <div className="relative w-full cursor-default rounded-md border border-inputBorder bg-jellyfishBgcolor py-1.5 pl-2.5 pr-8 text-left shadow-sm focus:border-primaryAccentHover focus:outline-none focus:ring-1 focus:ring-primaryAccent">
      <span className="block truncate">{selectedWorkspaceName}</span>
      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5">
        <SelectorIcon className="h-4 w-4 text-inputBorder" aria-hidden="true" />
      </span>
    </div>
  );
};

interface DisplayedWorkspace {
  id: string;
  name: string;
  expired?: boolean;
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
  const [expanded, setExpanded] = useState(false);
  let displayedWorkspaces: DisplayedWorkspace[] = workspaces
    .map(workspace => {
      const expired = subscriptionExpired(workspace);
      let name = workspace.name ?? "";
      if (expired) {
        name += " (Expired)";
      }
      return { id: workspace.id, name, expired };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  if (userInfo.features.library) {
    displayedWorkspaces = [personalWorkspace, ...displayedWorkspaces];
  }

  const handleSelect = (workspace: DisplayedWorkspace) => {
    if (!workspace.expired) {
      handleWorkspaceSelect(workspace.id);
      setExpanded(false);
    }
  };

  const selectedWorkspace =
    displayedWorkspaces.find(w => w.id === selectedWorkspaceId) || displayedWorkspaces[0];
  const selectedWorkspaceName = selectedWorkspace.name;
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
      <Dropdown widthClass="w-64" fontSizeClass="text-base">
        <div className="max-h-48 overflow-auto">
          {displayedWorkspaces.map(workspace => (
            <DropdownItem
              disabled={workspace.expired}
              onClick={() => handleSelect(workspace)}
              key={workspace.id}
            >
              {workspace.name || ""}
            </DropdownItem>
          ))}
        </div>
      </Dropdown>
    </PortalDropdown>
  );
}
