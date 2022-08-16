import React from "react";
import { Recording } from "ui/types";
import { PrimaryButton, SecondaryButton } from "../../../../../shared/Button";
import BatchActionDropdown from "./BatchActionDropdown";
import styles from "../../../../Library.module.css";
import TeamTrialEnd from "./TeamTrialEnd";
import { useGetTeamIdFromRoute } from "ui/components/Library/Team/utils";

function ViewerHeaderActions({
  isEditing,
  setIsEditing,
  setSelectedIds,
  selectedIds,
  recordings,
  handleDoneEditing,
}: {
  recordings: Recording[];
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  handleDoneEditing: () => void;
}) {
  if (isEditing) {
    return (
      <>
        <BatchActionDropdown
          setSelectedIds={setSelectedIds}
          selectedIds={selectedIds}
          recordings={recordings}
        />
        <PrimaryButton color="blue" onClick={handleDoneEditing}>
          Done
        </PrimaryButton>
      </>
    );
  }

  return (
    <>
      {recordings.length != 0 ? (
        <>
          <SecondaryButton
            className={styles.editButton}
            color="blue"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </SecondaryButton>
        </>
      ) : (
        <></>
      )}
    </>
  );
}

export default function ViewerHeader({
  recordings,
  selectedIds,
  setSelectedIds,
  handleDoneEditing,
  workspaceName,
  isEditing,
  setIsEditing,
}: {
  recordings: Recording[];
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  handleDoneEditing: () => void;
  workspaceName: string | React.ReactNode;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
}) {
  const currentWorkspaceId = useGetTeamIdFromRoute();

  const HeaderLeft = (
    <ViewerHeaderLeft>
      <span className={styles.workspaceName}>{workspaceName}</span>
      <span className={styles.workspaceName}>
        {recordings.length != 0 ? <>({recordings.length})</> : <></>}
      </span>
    </ViewerHeaderLeft>
  );

  return (
    <div className={`flex flex-row items-center justify-between ${styles.libraryHeaderButton}`}>
      {HeaderLeft}
      <div className="flex flex-row items-center space-x-3">
        {currentWorkspaceId ? <TeamTrialEnd currentWorkspaceId={currentWorkspaceId} /> : null}
        <ViewerHeaderActions
          recordings={recordings}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          handleDoneEditing={handleDoneEditing}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
        />
      </div>
    </div>
  );
}

export function ViewerHeaderLeft({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`flex flex-row items-center space-x-2 text-2xl font-semibold ${styles.libraryHeaderText}`}
    >
      {children}
    </div>
  );
}
