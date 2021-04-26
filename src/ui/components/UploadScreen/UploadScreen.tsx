import React, { useState, useEffect, useRef } from "react";
import { connect, ConnectedProps } from "react-redux";
import { getRecordingId } from "ui/reducers/app";
import { UIState } from "ui/state";
import hooks from "ui/hooks";
import "./UploadScreen.css";
import TeamSelect from "./TeamSelect";
import PrivacyToggle from "./PrivacyToggle";
import ReplayTitle from "./ReplayTitle";

type UploadScreenProps = PropsFromRedux & {};
type Status = "saving" | "deleting" | "deleted" | null;

function UploadScreen({ recordingId }: UploadScreenProps) {
  const { recording, loading: recordingLoading } = hooks.useGetRecording(recordingId!);
  const [status, setStatus] = useState<Status>(null);
  const [inputValue, setInputValue] = useState(recording?.title || "Untitled");
  const { userSettings } = hooks.useGetUserSettings();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    userSettings?.defaultWorkspaceId || null
  );
  const textInputNode = useRef<HTMLInputElement>(null);
  const [isPublic, setIsPublic] = useState(true);

  const { workspaces, loading } = hooks.useGetNonPendingWorkspaces();
  const initializeRecording = hooks.useInitializeRecording();
  const updateIsPrivate = hooks.useUpdateIsPrivate();
  const deleteRecording = hooks.useDeleteRecording([], () => setStatus("deleted"));

  const isSaving = status == "saving";
  const isDeleting = status == "deleting";
  const isDeleted = status == "deleted";

  useEffect(() => {
    if (textInputNode.current) {
      textInputNode.current.focus();
    }

    setIsPublic(!recording?.private);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setStatus("saving");

    const workspaceId = selectedWorkspaceId == "" ? null : selectedWorkspaceId;

    await initializeRecording({
      variables: { recordingId, title: inputValue, workspaceId },
    });
    updateIsPrivate({ variables: { recordingId, isPrivate: !isPublic } });
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
        <ReplayTitle inputValue={inputValue} setInputValue={setInputValue} />
        {workspaces.length ? (
          <TeamSelect
            {...{ workspaces, selectedWorkspaceId, setSelectedWorkspaceId, label: "Team" }}
          />
        ) : null}
        <PrivacyToggle isPublic={isPublic} setIsPublic={setIsPublic} />
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
export default connector(UploadScreen);
