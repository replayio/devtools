import React, { Dispatch, SetStateAction } from "react";
import { Workspace } from "ui/types";
import { SelectMenu } from "ui/components/shared/Forms";

export default function TeamSelect({
  workspaces,
  selectedWorkspaceId,
  setSelectedWorkspaceId,
}: {
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
  setSelectedWorkspaceId: Dispatch<SetStateAction<string | null>>;
}) {
  const displayedWorkspaces = [{ id: null, name: "---" }, ...workspaces].sort();

  return (
    <SelectMenu
      selected={selectedWorkspaceId}
      setSelected={setSelectedWorkspaceId}
      options={displayedWorkspaces}
    />
  );
}
