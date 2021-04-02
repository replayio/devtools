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
  selectedWorkspaceId: string | null;
  setSelectedWorkspaceId: Dispatch<SetStateAction<string | null>>;
}) {
  const personalWorkspace = workspaces.find(workspace => workspace.is_personal)!;
  const otherWorkspaces = workspaces.filter(workspace => !workspace.is_personal);
  const displayedWorkspaces = [personalWorkspace, ...otherWorkspaces];

  useEffect(() => {
    setSelectedWorkspaceId(personalWorkspace.id);
  }, [workspaces]);

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setSelectedWorkspaceId(selectedId);
  };

  if (selectedWorkspaceId == null || displayedWorkspaces.length <= 1) {
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
  const {
    recording: { title },
  } = hooks.useGetRecording(recordingId!);
  const [status, setStatus] = useState<Status>(null);
  const [inputValue, setInputValue] = useState(title);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const textInputNode = useRef<HTMLInputElement>(null);
  // const [isPublic, setIsPublic] = useState(true);

  const { workspaces, loading } = hooks.useGetNonPendingWorkspaces();
  const initializeRecording = hooks.useInitializeRecording();
  const deleteRecording = hooks.useDeleteRecording([], () => setStatus("deleted"));

  const isSaving = status == "saving";
  // const isDeleting = status == "deleting";
  const isDeleted = status == "deleted";

  useEffect(() => {
    if (textInputNode.current) {
      textInputNode.current.focus();
    }
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    initializeRecording({
      variables: { recordingId, title: inputValue, workspaceId: selectedWorkspaceId },
    });
    setStatus("saving");
  };
  // const onDiscard = (e: React.MouseEvent) => {
  //   e.preventDefault();
  //   deleteRecording({ variables: { recordingId, deletedAt: new Date().toISOString() } });
  //   setStatus("deleting");
  // };
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSaving) {
      return;
    }

    setInputValue(e.target.value);
  };

  if (loading) {
    return null;
  }

  return (
    <div className="initialization-screen">
      <main>
        <section className="content">
          <div className="header">
            <img className="logo" src="images/logo.svg" />
            <h1>{isDeleted ? "Recording deleted" : "Recording complete"}</h1>
          </div>
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
            {/* <div className="replay-privacy">
              <input
                id="replayPrivacy"
                type="checkbox"
                checked={isPublic}
                onChange={() => setIsPublic(!isPublic)}
              />
              <label htmlFor="replayPrivacy">Publicly available</label>
            </div> */}
            <WorkspaceDropdownList
              {...{ workspaces, selectedWorkspaceId, setSelectedWorkspaceId }}
            />
            <div className="actions">
              <input
                className="submit"
                type="submit"
                disabled={isSaving}
                value={isSaving ? "Saving..." : `Save & Upload`}
              />
              {/* {!isSaving ? (
                <button className="cancel" onClick={onDiscard}>
                  {isDeleting ? "Discarding..." : "Or discard"}
                </button>
              ) : null} */}
            </div>
          </form>
        </section>
        <section className="filler" />
      </main>
    </div>
  );
}

const connector = connect((state: UIState) => ({ recordingId: getRecordingId(state) }));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(DraftScreen);
