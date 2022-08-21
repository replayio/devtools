import React, { useState, useEffect, ReactNode, SetStateAction, Dispatch } from "react";
import hooks from "ui/hooks";
import ReplayTitle from "./ReplayTitle";
import Modal from "ui/components/shared/NewModal";
import { Recording, ExperimentalUserSettings } from "ui/types";
import LoadingScreen from "../shared/LoadingScreen";
import { useGetRecordingId } from "ui/hooks/recordings";
import { trackEvent } from "ui/utils/telemetry";
import { MY_LIBRARY } from "./libraryConstants";
import Sharing from "./Sharing";
import { Privacy, ToggleShowPrivacyButton } from "./Privacy";
import { UploadRecordingTrialEnd } from "./UploadRecordingTrialEnd";
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
    <div className="w-full h-full">
      <Modal>
        <div
          className="relative flex flex-col items-center justify-between space-y-4 overflow-y-auto text-base rounded-md shadow-lg bg-modalBgcolor p-9"
          style={{ width: "400px" }}
        >
          <ReplayLogo size="sm" />
          <h2 className="text-2xl font-bold ">{`Replay discarded`}</h2>
          <div className="space-y-2 text-md">
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
  const saveButtonRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveButtonRef.current?.focus(); // for faster/more keyboard accessible uploads
  }, []);

  return (
    <div className="space-x-5">
      <button
        type="button"
        onClick={onDiscard}
        disabled={shouldDisableActions}
        className="py-3.5 px-8 text-secondaryAccent hover:underline focus:underline focus:outline-none"
      >
        {isDeleting ? `Discarding…` : `Discard`}
      </button>
      <input
        type="submit"
        disabled={shouldDisableActions}
        value={isSaving ? `Uploading…` : `Save`}
        ref={saveButtonRef}
        className="mb-8 cursor-pointer rounded-xl bg-primaryAccent py-3.5 px-16 font-bold text-buttontextColor shadow-sm hover:bg-primaryAccentHover focus:border-primaryAccentHover focus:outline-none focus:ring focus:ring-primaryAccentHover"
      />
    </div>
  );
}

function LimitWarning() {
  return (
    <div className="absolute flex p-2 text-xs text-white bg-gray-500 rounded-md shadow-lg bottom-2 right-2 place-content-center">
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
    <div className="relative h-64 px-6 pt-6 rounded-lg shadow-lg bg-jellyfishBgcolor short:hidden">
      {showLimitWarning ? <LimitWarning /> : null}
      <img src={screenData} className="h-full m-auto" />
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

  if (loading1) {
    return <LoadingScreen fallbackMessage="Loading recording metadata..." />;
  }
  if (loading2) {
    return <LoadingScreen fallbackMessage="Loading team info..." />;
  }

  if (status === "deleted") {
    return <DeletedScreen url="/" />;
  }

  return (
    <BubbleViewportWrapper>
      <div className="flex flex-col items-center">
        <UploadRecordingTrialEnd {...{ selectedWorkspaceId, workspaces }} />
        <form className="relative flex flex-col items-center overflow-auto" onSubmit={onSubmit}>
          <div className="flex flex-row mb-10 space-x-4 short:h-auto">
            <div
              className="relative flex flex-col overflow-hidden text-lg font-medium shadow-lg rounded-xl"
              style={{ width: "620px" }}
            >
              <div className="absolute w-full h-full bg-jellyfishBgcolor" />
              <div className="relative px-8 space-y-6 py-9">
                <ReplayTitle inputValue={inputValue} setInputValue={setInputValue} />
                <ReplayScreenshot
                  screenData={screenData!}
                  showLimitWarning={showDurationWarning(recording)}
                />
              </div>
              <div className="relative px-8 space-y-6 border-t border-themeBorder py-9">
                <Sharing
                  workspaces={workspaces}
                  selectedWorkspaceId={selectedWorkspaceId}
                  setSelectedWorkspaceId={setSelectedWorkspaceId}
                  isPublic={isPublic}
                  setIsPublic={setIsPublic}
                />
                {isPublic && recording.operations ? (
                  <div className="border focus:bg-red-500 focus:text-blue-800">
                    <ToggleShowPrivacyButton
                      showPrivacy={showPrivacy}
                      operations={recording.operations}
                      setShowPrivacy={setShowPrivacy}
                    />
                  </div>
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
