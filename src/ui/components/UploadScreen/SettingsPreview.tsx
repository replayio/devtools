import React from "react";
import { Workspace } from "ui/types";

const getIconAndText = (
  isPublic: boolean,
  selectedWorkspaceId: string | null,
  workspaceName: string
) => {
  let text, icon;

  if (!isPublic) {
    if (selectedWorkspaceId) {
      text = `Shared privately with ${workspaceName}`;
      icon = "groups";
    } else {
      text = `Only you can view this`;
      icon = "person";
    }
  } else {
    text = "This replay can be viewed by anyone with the link";
    icon = "public";
  }

  return { text, icon };
};

export default function SettingsPreview({
  onClick,
  isPublic,
  workspaces,
  selectedWorkspaceId,
}: {
  onClick: () => void;
  isPublic: boolean;
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
}) {
  const personalWorkspace = { id: null, name: "My Library" };
  const workspaceName = [...workspaces, personalWorkspace].find(w => w.id === selectedWorkspaceId)!
    .name;

  const { icon, text } = getIconAndText(isPublic, selectedWorkspaceId, workspaceName);

  return (
    <button
      className="w-full flex flex-row justify-between items-center focus:outline-none"
      onClick={onClick}
      style={{ minHeight: "38px" }}
    >
      <div className="space-x-2.5 flex flex-row items-center">
        <span className="material-icons" style={{ fontSize: "24px" }}>
          {icon}
        </span>
        <div className="font-medium">{text}</div>
      </div>
      <div className="space-x-2 flex flex-row items-center text-primaryAccent">
        <div className="font-medium">Edit</div>
        <span className="material-icons" style={{ fontSize: "24px" }}>
          edit
        </span>
      </div>
    </button>
  );
}
