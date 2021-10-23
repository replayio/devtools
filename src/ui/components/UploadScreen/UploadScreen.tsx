import React, { useState, useEffect } from "react";
import hooks from "ui/hooks";
import ReplayTitle from "./ReplayTitle";
import classNames from "classnames";
import Modal from "ui/components/shared/NewModal";
import { Recording, UserSettings } from "ui/types";
import { LoadingScreen } from "../shared/BlankScreen";
import { useGetRecordingId } from "ui/hooks/recordings";
import { trackEvent, trackTiming } from "ui/utils/telemetry";
import BubbleBackground from "../shared/Onboarding/BubbleBackground";
import Sharing, { MY_LIBRARY } from "./Sharing";
const { isDemoReplay } = require("ui/utils/demo");

type UploadScreenProps = { recording: Recording; userSettings: UserSettings };
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

function ReplayScreenshot({ screenData }: { screenData: string }) {
  return (
    <div className="bg-white rounded-lg px-6 pt-6 shadow-xl h-64" style={{ height: "320px" }}>
      <img src={screenData} className="h-full m-auto" />
    </div>
  );
}

export default function UploadScreen({ recording, userSettings }: UploadScreenProps) {
  const recordingId = useGetRecordingId();
  // This is pre-loaded in the parent component.
  const { screenData, loading: loading1 } = hooks.useGetRecordingPhoto(recordingId!);
  const { workspaces, loading: loading2 } = hooks.useGetNonPendingWorkspaces();

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
    trackEvent(isDemoReplay(recording) ? "create demo replay" : "create replay");

    await initializeRecording({
      variables: { recordingId, title: inputValue, workspaceId },
    });
    updateIsPrivate({ variables: { recordingId, isPrivate: !isPublic } });
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
    <div
      className="w-full h-full grid fixed z-50 items-center justify-center"
      style={{ background: "#f3f3f4" }}
    >
      <BubbleBackground />
      <form
        className="relative flex flex-col items-center space-y-11 overflow-auto"
        onSubmit={onSubmit}
      >
        <div
          className="flex flex-col overflow-hidden relative rounded-xl shadow-xl text-lg font-medium"
          style={{ width: "620px" }}
        >
          <div className="absolute w-full h-full bg-white opacity-40" />
          <div className="py-9 px-8 space-y-6 relative">
            <ReplayTitle inputValue={inputValue} setInputValue={setInputValue} />
            <ReplayScreenshot screenData={screenData!} />
          </div>
          <Sharing
            workspaces={workspaces}
            selectedWorkspaceId={selectedWorkspaceId}
            setSelectedWorkspaceId={setSelectedWorkspaceId}
            isPublic={isPublic}
            setIsPublic={setIsPublic}
          />
        </div>
        <Actions onDiscard={onDiscard} status={status} />
      </form>
    </div>
  );
}
