import React, { Dispatch, SetStateAction, useState } from "react";
import hooks from "ui/hooks";
import TeamSelect from "./TeamSelect";
import { Workspace } from "ui/types";
import { Toggle } from "../shared/Forms";
import SettingsPreview from "./SettingsPreview";

export const MY_LIBRARY = "My Library";
export const personalWorkspace = { id: MY_LIBRARY, name: MY_LIBRARY };

type SharingProps = {
  workspaces: Workspace[];
  selectedWorkspaceId: string;
  setSelectedWorkspaceId: Dispatch<SetStateAction<string>>;
  isPublic: boolean;
  setIsPublic: Dispatch<SetStateAction<boolean>>;
};

function EditableSettings({
  workspaces,
  selectedWorkspaceId,
  setSelectedWorkspaceId,
  isPublic,
  setIsPublic,
}: Omit<SharingProps, "showSharingSettings">) {
  const updateDefaultWorkspace = hooks.useUpdateDefaultWorkspace();
  const handleWorkspaceSelect = (id: string) => {
    updateDefaultWorkspace({
      variables: { workspaceId: id },
    });
    setSelectedWorkspaceId(id);
  };

  return (
    <div className="w-full grid grid-cols-2 gap-5 text-base">
      {workspaces.length ? (
        <TeamSelect {...{ workspaces, handleWorkspaceSelect, selectedWorkspaceId }} />
      ) : null}
      <div
        className="space-x-2 flex flex-row items-center justify-between w-full border border-textFieldBorder rounded-md shadow-sm px-2.5 py-1.5 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-primaryAccent focus:border-primaryAccentHover bg-white"
        onClick={() => setIsPublic(!isPublic)}
      >
        <div>Public Access</div>
        <Toggle enabled={isPublic} setEnabled={setIsPublic} />
      </div>
    </div>
  );
}

export default function Sharing(props: SharingProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="relative border-t border-gray-300 py-10 px-8">
      {isEditing ? (
        <EditableSettings {...props} />
      ) : (
        <SettingsPreview {...props} onClick={() => setIsEditing(!isEditing)} />
      )}
    </div>
  );
}
