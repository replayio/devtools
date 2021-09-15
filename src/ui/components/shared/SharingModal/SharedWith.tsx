import React, { Dispatch, SetStateAction, useState } from "react";
import hooks from "ui/hooks";
import { Recording, Workspace } from "ui/types";
import TeamSelect from "ui/components/UploadScreen/TeamSelect";
import { PrimaryButton } from "../Button";
import Collaborators from "./Collaborators";
import { CollaboratorDbData } from "./CollaboratorsList";
import { commaListOfThings } from "ui/utils/helpers";

type SharedWithProps = {
  workspaces: Workspace[];
  collaborators: CollaboratorDbData[];
  recording: Recording;
};

export function SharedWith(props: SharedWithProps) {
  const { recording, workspaces, collaborators } = props;
  const currentWorkspaceId = recording.workspace?.id || null;
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(currentWorkspaceId);
  const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);
  const [isEditing, setIsEditing] = useState(false);
  const updateRecordingWorkspace = hooks.useUpdateRecordingWorkspace();
  function moveRecording() {
    if (selectedWorkspaceId !== currentWorkspaceId) {
      updateRecordingWorkspace(recording.id, currentWorkspaceId, selectedWorkspaceId);
    }
    setIsEditing(false);
  }

  return (
    <div className="space-y-2">
      <div className="w-full flex flex-row justify-between items-center">
        <h2 className="text-xl">Sharing</h2>
        {isEditing ? (
          <PrimaryButton color="blue" onClick={moveRecording}>
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
  recording,
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
    <div className="w-full justify-between flex flex-col space-y-3">
      {workspaces.length ? (
        <div className="w-full space-y-1.5">
          <div className="text-xs uppercase font-bold">{`Team`}</div>
          <TeamSelect {...{ workspaces, handleWorkspaceSelect, selectedWorkspaceId }} />
        </div>
      ) : null}
      <div className="w-full space-y-1.5">
        <div className="text-xs uppercase font-bold">{`People`}</div>
        <Collaborators recordingId={recording.id} />
      </div>
    </div>
  );
}

function getCollaboratorsSummary(workspace: Workspace, collaboratorCount: number) {
  const sharees = [];

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
    return <div className="pr-6">This is not currently shared with anybody</div>;
  }

  return <div className="pr-6">Shared with {commaListOfThings(sharees)}</div>;
}
