import React, { Dispatch, SetStateAction } from "react";
import { Workspace } from "ui/types";
import { SelectMenu } from "ui/components/shared/Forms";

export default function TeamSelect({
  workspaces,
  selectedWorkspaceId,
  handleWorkspaceSelect,
}: {
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
  handleWorkspaceSelect: (id: string | null) => void;
}) {
  const displayedWorkspaces = [{ id: null, name: "Your Library" }, ...workspaces].sort();

  return (
    <SelectMenu
      selected={selectedWorkspaceId}
      setSelected={handleWorkspaceSelect}
      options={displayedWorkspaces}
    />
  );
}
