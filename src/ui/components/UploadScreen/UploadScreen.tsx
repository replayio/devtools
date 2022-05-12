import React, { useState, useEffect, ReactNode, SetStateAction, Dispatch } from "react";
import hooks from "ui/hooks";
import ReplayTitle from "./ReplayTitle";
import classNames from "classnames";
import Modal from "ui/components/shared/NewModal";
import { Recording, ExperimentalUserSettings } from "ui/types";
import LoadingScreen from "../shared/LoadingScreen";
import { useGetRecordingId } from "ui/hooks/recordings";
import { trackEvent } from "ui/utils/telemetry";
import Sharing, { MY_LIBRARY } from "./Sharing";
import { Privacy, ToggleShowPrivacyButton } from "./Privacy";
import { UploadRecordingTrialEnd } from "./UploadRecordingTrialEnd";
import { startUploadWaitTracking } from "ui/utils/mixpanel";
import { BubbleViewportWrapper } from "../shared/Viewport";
import { showDurationWarning } from "ui/utils/recording";
import ReplayLogo from "../shared/ReplayLogo";
import { decodeWorkspaceId } from "ui/utils/workspace";
import Icon from "../shared/Icon";

type UploadScreenProps = {
  recording: Recording;
  userSettings: ExperimentalUserSettings;
  onUpload: () => void;
};
type Status = "saving" | "deleting" | "deleted" | null;

function DeletedScreen({ url }: { url: string }) {
  const navigateToUrl = () => {
    window.location.href = url;
  };
  useEffect(() => {
    setTimeout(() => {
      navigateToUrl();
    }, 1200);
  });

  return (
    <div className="h-full w-full">
      <Modal>
        <div
          className="relative flex flex-col items-center justify-between space-y-4 overflow-y-auto rounded-md bg-modalBgcolor p-9 text-base shadow-lg"
          style={{ width: "400px" }}
        >
          <ReplayLogo size="sm" />
          <h2 className="text-2xl font-bold ">{`Replay discarded`}</h2>
          <div className="text-md space-y-2">
            <div>{`Hang tight while we load your library...`}</div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Actions({ onDiscard, status }: { onDiscard: () => void; status: Status }) {
  const isSaving = status === "saving";
  const isDeleting = status === "deleting";
  const shouldDisableActions = isSaving || isDeleting;

  return (
    <div className="space-x-5">
      <button
        type="button"
        onClick={onDiscard}
        disabled={shouldDisableActions}
        className="py-3.5 px-8 text-secondaryAccent hover:underline"
      >
        {isDeleting ? `Discarding…` : `Discard`}
      </button>
      <input
        type="submit"
        disabled={shouldDisableActions}
        value={isSaving ? `Uploading…` : `Save`}
        className="cursor-pointer rounded-xl bg-primaryAccent py-3.5 px-16 font-bold text-white hover:bg-primaryAccentHover"
      />
    </div>
  );
}

function LimitWarning() {
  return (
    <div className="absolute bottom-2 right-2 flex place-content-center rounded-md bg-gray-500 p-2 text-xs text-white shadow-lg">
      <Icon filename="warning" size="small" className="bg-white" />
      <span className="px-1">Replays work best under 2 minutes</span>
    </div>
  );
}

function ReplayScreenshot({
  screenData,
  showLimitWarning,
}: {
  screenData: string;
  showLimitWarning: boolean;
}) {
  return (
    <div className="relative h-64 rounded-lg bg-jellyfishBgcolor px-6 pt-6 shadow-lg short:hidden">
      {showLimitWarning ? <LimitWarning /> : null}
      <img src={screenData} className="m-auto h-full" />
    </div>
  );
}

export default function UploadScreen({ recording, userSettings, onUpload }: UploadScreenProps) {
  const recordingId = useGetRecordingId();
  // This is pre-loaded in the parent component.
  const { screenData, loading: loading1 } = hooks.useGetRecordingPhoto(recordingId!);
  const { workspaces, loading: loading2 } = hooks.useGetNonPendingWorkspaces();
  const [showPrivacy, setShowPrivacy] = useState(false);

  const [status, setStatus] = useState<Status>(null);
  const [inputValue, setInputValue] = useState(recording?.title || "Untitled");
  // The actual replay in the database is public by default, for test purposes.
  // Before being initialized, public/private behaves similarly since non-authors
  // can't view the replay.
  const [isPublic, setIsPublic] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(
    userSettings?.defaultWorkspaceId || MY_LIBRARY
  );

  const initializeRecording = hooks.useInitializeRecording();
  const updateIsPrivate = hooks.useUpdateIsPrivate();
  const deleteRecording = hooks.useDeleteRecording(() => setStatus("deleted"));

  useEffect(() => {
    // Show a prompt making sure the user doesn't accidentally navigate away from the page.
    window.onbeforeunload = () => {
      return true;
    };

    return () => {
      window.onbeforeunload = null;
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setStatus("saving");
    const workspaceId = selectedWorkspaceId == MY_LIBRARY ? null : selectedWorkspaceId;

    trackEvent("upload.create_replay", {
      workspaceUuid: decodeWorkspaceId(workspaceId),
    });
    startUploadWaitTracking();

    await initializeRecording({
      variables: { recordingId, title: inputValue, workspaceId },
    });
    updateIsPrivate(recordingId, !isPublic);
    onUpload();
  };
  const onDiscard = () => {
    setStatus("deleting");
    trackEvent("upload.discard");
    window.onbeforeunload = null;
    deleteRecording({ variables: { recordingId } });
  };

  if (loading1 || loading2) {
    return <LoadingScreen />;
  }

  if (status === "deleted") {
    return <DeletedScreen url="/" />;
  }

  return (
    <BubbleViewportWrapper>
      <div className="flex flex-col items-center">
        <UploadRecordingTrialEnd {...{ selectedWorkspaceId, workspaces }} />
        <form className="relative flex flex-col items-center overflow-auto" onSubmit={onSubmit}>
          <div className="mb-10 flex flex-row space-x-4 short:h-auto">
            <div
              className="relative flex flex-col overflow-hidden rounded-xl text-lg font-medium shadow-lg"
              style={{ width: "620px" }}
            >
              <div className="absolute h-full w-full bg-jellyfishBgcolor" />
              <div className="relative space-y-6 py-9 px-8">
                <ReplayTitle inputValue={inputValue} setInputValue={setInputValue} />
                <ReplayScreenshot
                  screenData={screenData!}
                  showLimitWarning={showDurationWarning(recording)}
                />
              </div>
              <div className="relative space-y-6 border-t border-themeBorder py-9 px-8">
                <Sharing
                  workspaces={workspaces}
                  selectedWorkspaceId={selectedWorkspaceId}
                  setSelectedWorkspaceId={setSelectedWorkspaceId}
                  isPublic={isPublic}
                  setIsPublic={setIsPublic}
                />
                {isPublic ? (
                  <ToggleShowPrivacyButton
                    showPrivacy={showPrivacy}
                    operations={recording.operations}
                    setShowPrivacy={setShowPrivacy}
                  />
                ) : null}
              </div>
            </div>
            {showPrivacy && isPublic ? (
              <div style={{ width: "440px" }}>
                <Privacy />
              </div>
            ) : null}
          </div>
          <Actions onDiscard={onDiscard} status={status} />
        </form>
      </div>
    </BubbleViewportWrapper>
  );
}
