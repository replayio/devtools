import React, { useState, useEffect, ReactNode, SetStateAction, Dispatch } from "react";
import hooks from "ui/hooks";
import ReplayTitle from "./ReplayTitle";
import classNames from "classnames";
import Modal from "ui/components/shared/NewModal";
import { Recording, UserSettings } from "ui/types";
import { LoadingScreen } from "../shared/BlankScreen";
import { useGetRecordingId } from "ui/hooks/recordings";
import { trackEvent, trackTiming } from "ui/utils/telemetry";
import Sharing, { MY_LIBRARY } from "./Sharing";
import { Privacy, ToggleShowPrivacyButton } from "./Privacy";
import MaterialIcon from "../shared/MaterialIcon";
import PortalTooltip from "../shared/PortalTooltip";
import { UploadRecordingTrialEnd } from "./UploadRecordingTrialEnd";
import BubbleModal from "../shared/Onboarding/BubbleModal";
import { startUploadWaitTracking } from "ui/utils/mixpanel";
const { isDemoReplay } = require("ui/utils/demo");

type UploadScreenProps = { recording: Recording; userSettings: UserSettings; onUpload: () => void };
type Status = "saving" | "deleting" | "deleted" | null;

function DeletedScreen({ url }: { url: string }) {
  const navigateToUrl = () => {
    window.location.href = url;
  };
  useEffect(() => {
    setTimeout(() => {
      navigateToUrl();
    }, 5000);
  });

  return (
    <div className="w-full h-full" style={{ background: "white" }}>
      <Modal>
        <div
          className="p-9 bg-white rounded-md shadow-xl text-base space-y-9 relative flex flex-col justify-between overflow-y-auto"
          style={{ width: "300px", maxHeight: "90vh" }}
        >
          <h2 className="font-bold text-2xl ">{`Redirecting...`}</h2>
          <div className="text-gray-500 space-y-5 text-lg">
            <div>{`Sit tight! We'll take you back to the library in a few seconds.`}</div>
          </div>
          <div className="space-y-1">
            <button
              type="button"
              onClick={navigateToUrl}
              className={classNames(
                "inline-flex items-center px-3 py-1.5 border border-transparent text-base font-medium rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccentHover justify-center",
                "text-white bg-primaryAccent hover:bg-primaryAccentHover"
              )}
            >
              Go now
            </button>
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
        className="text-secondaryAccent underline py-3.5 px-8"
      >
        {isDeleting ? `Discarding…` : `Discard`}
      </button>
      <input
        type="submit"
        disabled={shouldDisableActions}
        value={isSaving ? `Uploading…` : `Save`}
        className="text-white py-3.5 px-16 rounded-xl font-bold cursor-pointer bg-primaryAccent"
      />
    </div>
  );
}

function LimitWarning() {
  return (
    <div className="absolute bottom-4 right-4 flex p-2 rounded-full bg-gray-500 text-white shadow-lg">
      <PortalTooltip
        tooltip={
          <div
            className="text-base bg-toolbarBackground p-2 px-3 rounded-md shadow-lg mb-4"
            style={{ width: "200px" }}
          >
            {`Replays work best when under 2 minutes`}
          </div>
        }
      >
        <MaterialIcon className="select-none">warning</MaterialIcon>
      </PortalTooltip>
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
    <div
      className="relative rounded-lg px-6 pt-6 shadow-xl h-64 bg-jellyfish"
      style={{ height: "280px" }}
    >
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
    const workspaceId = selectedWorkspaceId == "" ? null : selectedWorkspaceId;

    trackTiming("kpi-time-to-view-replay");
    trackEvent("create replay", { isDemo: isDemoReplay(recording) });
    startUploadWaitTracking();

    await initializeRecording({
      variables: { recordingId, title: inputValue, workspaceId },
    });
    updateIsPrivate({ variables: { recordingId, isPrivate: !isPublic } });
    onUpload();
  };
  const onDiscard = () => {
    setStatus("deleting");
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
    <BubbleModal>
      <div className="flex flex-col items-center relative">
        <UploadRecordingTrialEnd {...{ selectedWorkspaceId, workspaces }} />
        <form className="relative flex flex-col items-center overflow-auto" onSubmit={onSubmit}>
          <div
            className="flex flex-row space-x-4 mb-11"
            style={{ height: isPublic ? "620px" : "" }}
          >
            <div
              className="flex flex-col overflow-hidden relative rounded-xl shadow-xl text-lg font-medium"
              style={{ width: "620px" }}
            >
              <div className="absolute w-full h-full bg-jellyfish" />
              <div className="py-9 px-8 space-y-6 relative">
                <ReplayTitle inputValue={inputValue} setInputValue={setInputValue} />
                <ReplayScreenshot
                  screenData={screenData!}
                  showLimitWarning={recording.duration > 120 * 1000}
                />
              </div>
              <div className="py-9 space-y-6 px-8 border-t border-gray-300 relative">
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
    </BubbleModal>
  );
}
