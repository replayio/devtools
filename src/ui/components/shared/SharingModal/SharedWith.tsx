import React, { Dispatch, SetStateAction, useState } from "react";
import hooks from "ui/hooks";
import { Recording, Workspace } from "ui/types";
import TeamSelect from "ui/components/UploadScreen/TeamSelect";
import { PrimaryButton } from "../Button";
import Collaborators from "./Collaborators";
import { CollaboratorDbData } from "./CollaboratorsList";

type SharedWithProps = {
  workspaces: Workspace[];
  collaborators: CollaboratorDbData[];
  recordingId: string;
  defaultWorkspaceId: string | null;
};

export function SharedWith(props: SharedWithProps) {
  const { defaultWorkspaceId, workspaces, collaborators } = props;
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    defaultWorkspaceId || null
  );
  const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-4">
      <div className="w-full flex flex-row justify-between items-center">
        <h2 className="text-2xl">Shared with</h2>
        {isEditing ? (
          <PrimaryButton color="blue" onClick={() => setIsEditing(false)}>
            Done
          </PrimaryButton>
        ) : null}
      </div>
      {isEditing ? (
        <SharedWithForm {...{ ...props, isEditing, setSelectedWorkspaceId, selectedWorkspaceId }} />
      ) : (
        <div className="w-full justify-between flex flex-row items-center">
          {getCollaboratorsSummary(selectedWorkspace!, collaborators.length)}
          <PrimaryButton color="blue" onClick={() => setIsEditing(true)}>
            Edit
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}

function SharedWithForm({
  workspaces,
  setSelectedWorkspaceId,
  selectedWorkspaceId,
  recordingId,
}: SharedWithProps & {
  isEditing: boolean;
  setSelectedWorkspaceId: Dispatch<SetStateAction<string | null>>;
  selectedWorkspaceId: string | null;
}) {
  const updateDefaultWorkspace = hooks.useUpdateDefaultWorkspace();

  const handleWorkspaceSelect = (id: string | null) => {
    updateDefaultWorkspace({
      variables: { workspaceId: id },
    });
    setSelectedWorkspaceId(id);
  };

  return (
    <div className="w-full justify-between flex flex-col space-y-4">
      {workspaces.length ? (
        <div className="w-full space-y-2">
          <div className="text-sm uppercase font-bold">{`Team`}</div>
          <TeamSelect {...{ workspaces, handleWorkspaceSelect, selectedWorkspaceId }} />
        </div>
      ) : null}
      <div className="w-full space-y-2">
        <div className="text-sm uppercase font-bold">{`People`}</div>
        <Collaborators {...{ recordingId }} />
      </div>
    </div>
  );
}

function getCollaboratorsSummary(workspace: Workspace, collaboratorCount: number) {
  const sharees = [];

  console.log({ workspace });

  if (workspace && workspace.members?.filter(a => a).length) {
    sharees.push(
      `${workspace.members?.filter(a => a).length} member${
        workspace.members?.length === 1 ? "" : "s"
      } of ${workspace?.name}`
    );
  }

  if (collaboratorCount) {
    sharees.push(`${collaboratorCount} other person${collaboratorCount === 1 ? "" : "s"}`);
  }

  if (sharees.length === 0) {
    return <div className="pr-8">This is not currently shared with anybody</div>;
  }

  return <div className="pr-8">Shared with {commaListOfThings(sharees)}</div>;
}

function commaListOfThings(things: string[]) {
  const listOfThings = [...things];
  const finalThing = listOfThings.pop();

  if (things.length <= 1) {
    return finalThing;
  }

  return `${listOfThings.join(", ")}, and ${finalThing}`;
}
