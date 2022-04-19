import classNames from "classnames";
import React from "react";
import { Workspace } from "ui/types";
import { getOrganizationSettings } from "ui/utils/org";

import { MY_LIBRARY, personalWorkspace } from "./Sharing";

const getIconAndText = (
  isPublic: boolean,
  selectedWorkspaceId: string,
  workspaceName: string
): {
  text: string;
  icon: string;
} => {
  if (isPublic) {
    return {
      icon: "public",
      text: "This replay can be viewed by anyone with the link",
    };
  }

  if (selectedWorkspaceId === MY_LIBRARY) {
    return {
      icon: "person",
      text: `Only you can view this`,
    };
  }

  return {
    icon: "groups",
    text: `Shared privately with ${workspaceName}`,
  };
};

type SettingsPreviewProps = {
  onClick: () => void;
  isPublic: boolean;
  workspaces: Workspace[];
  selectedWorkspaceId: string;
};

export default function SettingsPreview({
  onClick,
  isPublic,
  workspaces,
  selectedWorkspaceId,
}: SettingsPreviewProps) {
  const { features } = getOrganizationSettings(workspaces);
  const canEdit = workspaces.length > 1 || features.user.library || features.recording.public;

  const workspaceName = canEdit
    ? [...workspaces, personalWorkspace].find(w => w.id === selectedWorkspaceId)!.name
    : workspaces[0]!.name;

  const { icon, text } = getIconAndText(isPublic, selectedWorkspaceId, workspaceName);

  return (
    <button
      className={classNames(
        !canEdit && "cursor-default",
        "flex w-full flex-row items-center justify-between focus:outline-none"
      )}
      type="button"
      onClick={canEdit ? onClick : undefined}
      style={{ minHeight: "38px" }}
    >
      <div className="flex flex-row items-center space-x-2.5">
        <span className="material-icons" style={{ fontSize: "24px" }}>
          {icon}
        </span>
        <div className="font-medium">{text}</div>
      </div>
      {canEdit ? (
        <div className="flex flex-row items-center space-x-2 text-primaryAccent">
          <div className="font-medium">Edit</div>
          <span className="material-icons" style={{ fontSize: "24px" }}>
            edit
          </span>
        </div>
      ) : null}
    </button>
  );
}
