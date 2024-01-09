import React, { useEffect, useState } from "react";

import { Recording, UserSettings, Workspace } from "shared/graphql/types";
import { showDurationWarning } from "shared/utils/recording";
import Modal from "ui/components/shared/NewModal";
import hooks from "ui/hooks";
import { useGetRecordingId } from "ui/hooks/recordings";
import { trackEvent } from "ui/utils/telemetry";
import { decodeWorkspaceId } from "ui/utils/workspace";

import Icon from "../shared/Icon";
import LoadingScreen from "../shared/LoadingScreen";
import ReplayLogo from "../shared/ReplayLogo";
import { DefaultViewportWrapper } from "../shared/Viewport";
import { MY_LIBRARY } from "./libraryConstants";
import { Privacy, ToggleShowPrivacyButton } from "./Privacy";
import ReplayTitle from "./ReplayTitle";
import Sharing from "./Sharing";
import { UploadRecordingTrialEnd } from "./UploadRecordingTrialEnd";

type UploadScreenProps = {
  recording: Recording;
  workspaces: Workspace[];
  userSettings: UserSettings;
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
        className="mb-8 cursor-pointer rounded-xl bg-primaryAccent py-3.5 px-16 font-bold text-buttontextColor shadow-sm ring-offset-1 hover:bg-primaryAccentHover focus:border-primaryAccent focus:outline-none focus:ring-2 focus:ring-primaryAccent"
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

export default function UploadScreen({
  recording,
  userSettings,
  workspaces: allWorkspaces,
  onUpload,
}: UploadScreenProps) {
  const recordingId = useGetRecordingId();
  // This is pre-loaded in the parent component.
  const { screenData, loading: loading1 } = hooks.useGetRecordingPhoto(recordingId!);

  const workspaces = allWorkspaces.filter(workspace => workspace.isTest === recording.isTest);

  const [showPrivacy, setShowPrivacy] = useState(false);

  const [status, setStatus] = useState<Status>(null);
  const [inputValue, setInputValue] = useState(recording?.title || "Untitled");
  // The actual replay in the database is public by default, for test purposes.
  // Before being initialized, public/private behaves similarly since non-authors
  // can't view the replay.
  const [isPublic, setIsPublic] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(() => {
    let workspaceId = userSettings?.defaultWorkspaceId;

    if (!workspaceId) {
      return MY_LIBRARY;
    }

    if (workspaces.find(workspace => workspace.id === workspaceId)) {
      return workspaceId;
    }

    return MY_LIBRARY;
  });

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
    return <LoadingScreen message="Loading recording metadata..." />;
  }

  if (status === "deleted") {
    return <DeletedScreen url="/" />;
  }

  return (
    <DefaultViewportWrapper>
      <div className="flex flex-col items-center">
        <UploadRecordingTrialEnd {...{ selectedWorkspaceId, workspaces }} />
        <form className="relative flex flex-col items-center overflow-auto" onSubmit={onSubmit}>
          <div className="mb-10 flex flex-row space-x-4 short:h-auto">
            <div
              className="relative flex flex-col overflow-hidden rounded-xl text-lg font-medium shadow-lg"
              style={{ width: "620px" }}
            >
              <div className="absolute h-full w-full bg-jellyfishBgcolor" />
              <div className="relative space-y-6 px-8 py-9">
                <ReplayTitle inputValue={inputValue} setInputValue={setInputValue} />
                <ReplayScreenshot
                  screenData={screenData!}
                  showLimitWarning={showDurationWarning(recording)}
                />
              </div>
              <div className="relative space-y-6 border-t border-themeBorder px-8 py-9">
                <Sharing
                  workspaces={workspaces}
                  selectedWorkspaceId={selectedWorkspaceId}
                  setSelectedWorkspaceId={setSelectedWorkspaceId}
                  isPublic={isPublic}
                  setIsPublic={setIsPublic}
                />
                {isPublic && recording.operations ? (
                  <div className="border border-inputBorder focus:bg-red-500 focus:text-blue-800">
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
              <div
                className="relative flex h-full overflow-hidden rounded-xl bg-themeBase-90 shadow-xl"
                style={{ width: "440px" }}
              >
                <Privacy />
              </div>
            ) : null}
          </div>
          <Actions onDiscard={onDiscard} status={status} />
        </form>
      </div>
    </DefaultViewportWrapper>
  );
}
