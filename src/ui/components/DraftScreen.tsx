import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { connect, ConnectedProps } from "react-redux";
import { getRecordingId } from "ui/reducers/app";
import { UIState } from "ui/state";
import hooks from "ui/hooks";
import "./DraftScreen.css";
import { Workspace } from "ui/types";

type DraftScreenProps = PropsFromRedux & {};
type Status = "saving" | "deleting" | "deleted" | null;

function WorkspaceDropdownList({
  workspaces,
  selectedWorkspaceId,
  setSelectedWorkspaceId,
}: {
  workspaces: Workspace[];
  selectedWorkspaceId: string;
  setSelectedWorkspaceId: Dispatch<SetStateAction<string>>;
}) {
  const otherWorkspaces = workspaces.filter(workspace => !workspace.is_personal);
  const displayedWorkspaces = [{ id: "", key: "", name: "---" }, ...otherWorkspaces];

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setSelectedWorkspaceId(selectedId);
  };

  // If there are no other workspaces apart from the personal "---" one,
  // don't display the workspace dropdown.
  if (displayedWorkspaces.length == 1) {
    return null;
  }

  return (
    <div className="replay-workspace">
      <label>
        <h4>Workspace</h4>
      </label>
      <select onChange={onChange} value={selectedWorkspaceId}>
        {displayedWorkspaces.map(workspace => (
          <option value={workspace.id} key={workspace.id}>
            {workspace.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function DraftScreen({ recordingId }: DraftScreenProps) {
  const { recording, loading: recordingLoading } = hooks.useGetRecording(recordingId!);
  const [status, setStatus] = useState<Status>(null);
  const [inputValue, setInputValue] = useState(recording?.title);
  const { userSettings } = hooks.useGetUserSettings();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(
    userSettings?.default_workspace_id
  );
  const textInputNode = useRef<HTMLInputElement>(null);
  const [isPublic, setIsPublic] = useState(true);

  const { workspaces, loading } = hooks.useGetNonPendingWorkspaces();
  const initializeRecording = hooks.useInitializeRecording();
  const deleteRecording = hooks.useDeleteRecording([], () => setStatus("deleted"));

  const isSaving = status == "saving";
  const isDeleting = status == "deleting";
  const isDeleted = status == "deleted";

  useEffect(() => {
    if (textInputNode.current) {
      textInputNode.current.focus();
    }

    setIsPublic(!recording?.is_private);
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const workspaceId = selectedWorkspaceId == "" ? null : selectedWorkspaceId;

    initializeRecording({
      variables: { recordingId, title: inputValue, workspaceId, isPrivate: !isPublic },
    });
    setStatus("saving");
  };
  const onDiscard = (e: React.MouseEvent) => {
    e.preventDefault();
    deleteRecording({ variables: { recordingId, deletedAt: new Date().toISOString() } });
    setStatus("deleting");
  };
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSaving) {
      return;
    }

    setInputValue(e.target.value);
  };

  if (loading || recordingLoading) {
    return null;
  }

  return (
    <section className="initialization-panel">
      <form onSubmit={onSubmit} className={isDeleted ? "hidden" : ""}>
        <div className="replay-title">
          <label htmlFor="recordingTitle">
            <h4>Replay Title</h4>
          </label>
          <input
            id="recordingTitle"
            type="text"
            value={inputValue}
            onChange={onChange}
            ref={textInputNode}
          />
        </div>
        <div className="replay-privacy">
          <input
            id="replayPrivacy"
            type="checkbox"
            checked={isPublic}
            onChange={() => setIsPublic(!isPublic)}
          />
          <label htmlFor="replayPrivacy">Publicly available</label>
        </div>
        <WorkspaceDropdownList {...{ workspaces, selectedWorkspaceId, setSelectedWorkspaceId }} />
        <div className="actions">
          <input
            className="submit"
            type="submit"
            disabled={isSaving}
            value={isSaving ? "Continuing..." : `Continue`}
          />
          {!isSaving ? (
            <button className="cancel" onClick={onDiscard}>
              {isDeleting ? "Discarding..." : "Or discard"}
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

const connector = connect((state: UIState) => ({ recordingId: getRecordingId(state) }));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(DraftScreen);
