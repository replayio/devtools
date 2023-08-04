import classNames from "classnames";

import { Workspace } from "shared/graphql/types";
import { getOrganizationSettings } from "ui/utils/org";

import { MY_LIBRARY, personalWorkspace } from "./libraryConstants";

export default function SettingsPreview({
  isPublic,
  onClick,
  selectedWorkspaceId,
  workspaces,
}: {
  isPublic: boolean;
  onClick: () => void;
  selectedWorkspaceId: string;
  workspaces: Workspace[];
}) {
  const { features } = getOrganizationSettings(workspaces);
  const canEdit = workspaces.length > 1 || features.user.library || features.recording.public;

  const workspaceName = canEdit
    ? [...workspaces, personalWorkspace].find(w => w.id === selectedWorkspaceId)!.name
    : workspaces[0]!.name;

  let icon: string;
  let text: string;
  if (isPublic) {
    text = "This replay can be viewed by anyone with the link";
    icon = "public";
  } else if (selectedWorkspaceId === MY_LIBRARY) {
    text = `Only you can view this`;
    icon = "person";
  } else {
    text = `Shared privately with ${workspaceName}`;
    icon = "groups";
  }

  return (
    <button
      className={classNames(
        !canEdit && "cursor-default",
        "flex w-full flex-row items-center justify-between hover:text-primaryAccent focus:text-primaryAccentHover focus:outline-none"
      )}
      type="button"
      onClick={canEdit ? onClick : undefined}
      style={{ minHeight: "38px" }}
    >
      <div className="flex flex-row items-center space-x-2.5 truncate">
        <span className="material-icons" style={{ fontSize: "24px" }}>
          {icon}
        </span>
        <div className="truncate font-medium">{text}</div>
      </div>
      {canEdit ? (
        <div className="flex flex-row items-center space-x-2">
          <div className="font-medium">Edit</div>
          <span className="material-icons" style={{ fontSize: "24px" }}>
            edit
          </span>
        </div>
      ) : null}
    </button>
  );
}
