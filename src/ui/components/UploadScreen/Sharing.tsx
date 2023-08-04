import classNames from "classnames";
import { Dispatch, SetStateAction, useState } from "react";

import { Workspace } from "shared/graphql/types";
import { useUpdateDefaultWorkspace } from "ui/hooks/settings";
import { isPublicDisabled } from "ui/utils/org";

import { Toggle } from "../shared/Forms";
import { MY_LIBRARY } from "./libraryConstants";
import SettingsPreview from "./SettingsPreview";
import TeamSelect from "./TeamSelect";

export default function EditableSettings({
  isPublic,
  selectedWorkspaceId,
  setIsPublic,
  setSelectedWorkspaceId,
  workspaces,
}: {
  isPublic: boolean;
  selectedWorkspaceId: string;
  setIsPublic: Dispatch<SetStateAction<boolean>>;
  setSelectedWorkspaceId: Dispatch<SetStateAction<string>>;
  workspaces: Workspace[];
}) {
  const updateDefaultWorkspace = useUpdateDefaultWorkspace();

  const [isEditing, setIsEditing] = useState(false);
  if (!isEditing) {
    return (
      <div className="relative">
        <SettingsPreview
          isPublic={isPublic}
          onClick={() => setIsEditing(!isEditing)}
          selectedWorkspaceId={selectedWorkspaceId}
          workspaces={workspaces}
        />
      </div>
    );
  }

  const publicDisabled = isPublicDisabled(workspaces, selectedWorkspaceId);

  const handleWorkspaceSelect = (id: string) => {
    setIsPublic(isPublic && !isPublicDisabled(workspaces, id));
    setSelectedWorkspaceId(id);
    const dbWorkspaceId = id === MY_LIBRARY ? null : id;
    updateDefaultWorkspace({ variables: { workspaceId: dbWorkspaceId } });
  };

  return (
    <div className="relative">
      <div className="grid w-full grid-cols-2 gap-5 text-base">
        <TeamSelect {...{ handleWorkspaceSelect, selectedWorkspaceId, workspaces }} />
        <div
          className={classNames(
            publicDisabled ? "opacity-60" : undefined,
            "flex w-full cursor-default select-none flex-row items-center justify-between space-x-2 rounded-md border border-inputBorder bg-jellyfishBgcolor px-2.5 py-1.5 text-left shadow-sm focus:border-primaryAccentHover focus:outline-none focus:ring-1 focus:ring-primaryAccent"
          )}
          onClick={() => !publicDisabled && setIsPublic(!isPublic)}
        >
          <div>Public Access</div>
          <Toggle
            enabled={isPublic && !publicDisabled}
            setEnabled={publicDisabled ? () => {} : setIsPublic}
          />
        </div>
      </div>
    </div>
  );
}
