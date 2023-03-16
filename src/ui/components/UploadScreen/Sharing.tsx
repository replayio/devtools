import classNames from "classnames";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";

import { Workspace } from "shared/graphql/types";
import hooks from "ui/hooks";
import { isPublicDisabled } from "ui/utils/org";

import { Toggle } from "../shared/Forms";
import { MY_LIBRARY } from "./libraryConstants";
import SettingsPreview from "./SettingsPreview";
import TeamSelect from "./TeamSelect";

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
  const publicDisabled = isPublicDisabled(workspaces, selectedWorkspaceId);

  const handleWorkspaceSelect = (id: string) => {
    setIsPublic(isPublic && !isPublicDisabled(workspaces, id));
    setSelectedWorkspaceId(id);
    const dbWorkspaceId = id === MY_LIBRARY ? null : id;
    updateDefaultWorkspace({ variables: { workspaceId: dbWorkspaceId } });
  };

  return (
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
  );
}

export default function Sharing(props: SharingProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="relative">
      {isEditing ? (
        <EditableSettings {...props} />
      ) : (
        <SettingsPreview {...props} onClick={() => setIsEditing(!isEditing)} />
      )}
    </div>
  );
}
