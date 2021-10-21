import React, { useState, useEffect, Dispatch, SetStateAction } from "react";
import hooks from "ui/hooks";
import TeamSelect from "./TeamSelect";
import { getFormattedTime } from "ui/utils/timeline";
import ReplayTitle from "./ReplayTitle";
import classNames from "classnames";
import Modal from "ui/components/shared/NewModal";
import { Recording, UserSettings, Workspace } from "ui/types";
import { LoadingScreen } from "../shared/BlankScreen";
import MaterialIcon from "../shared/MaterialIcon";
import { useGetRecordingId } from "ui/hooks/recordings";
import { trackEvent, trackTiming } from "ui/utils/telemetry";
import { UploadRecordingTrialEnd } from "./UploadRecordingTrialEnd";
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

function SoftLimitWarning() {
  return (
    <div className="flex flex-row space-x-2 border rounded-lg p-4 border-yellow-400 bg-yellow-50">
      <div className="flex flex-col space-y-2">
        <div className="flex flex-row text-yellow-800 font-medium text-xl items-center space-x-1">
          <MaterialIcon className="text-yellow-800">warning_amber</MaterialIcon>
          <div>This replay is over 2 minutes</div>
        </div>
        <div>We recommend keeping replays below 2 minutes for the best debugging experience.</div>
      </div>
    </div>
  );
}

function Actions({ onDiscard, status }: { onDiscard: () => void; status: Status }) {
  const isSaving = status === "saving";
  const isDeleting = status === "deleting";

  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <button
        type="button"
        onClick={onDiscard}
        disabled={isSaving || isDeleting}
        className={classNames(
          "inline-flex items-center px-4 py-2 border border-textFieldBorder font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent justify-center",
          "text-gray-500 hover:bg-gray-100 hover:"
        )}
      >
        {isDeleting ? `Discarding…` : `Discard`}
      </button>
      <input
        type="submit"
        disabled={isSaving || isDeleting}
        value={isSaving ? `Uploading…` : `Save & Upload`}
        className={classNames(
          "inline-flex items-center px-4 py-2 border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccentHover justify-center cursor-pointer",
          "text-white bg-primaryAccent hover:bg-primaryAccentHover"
        )}
      ></input>
    </div>
  );
}

function ReplayPreview({ recording, screenData }: { recording: Recording; screenData: string }) {
  return (
    <div className="space-y-1">
      <div className="block text-xs uppercase font-semibold ">Preview</div>
      <div
        className="relative bg-gray-100 border border-gray-200 rounded-lg text-xs"
        style={{ height: "200px" }}
      >
        <img src={screenData} className="h-full m-auto" />
        <div
          style={{ maxWidth: "50%" }}
          className="bg-gray-700 text-white bottom-4 left-4 rounded-lg px-3 py-0.5 absolute select-none"
        >
          <div className="whitespace-pre overflow-hidden overflow-ellipsis">{recording.url}</div>
        </div>
        <div className="bg-gray-700 text-white bottom-4 right-4 rounded-lg px-3 py-0.5 absolute select-none">
          {getFormattedTime(recording!.duration)}
        </div>
      </div>
    </div>
  );
}

export function SharingSettings({
  workspaces,
  selectedWorkspaceId,
  setSelectedWorkspaceId,
  isPublic,
  setIsPublic,
}: {
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
  setSelectedWorkspaceId: Dispatch<SetStateAction<string | null>>;
  isPublic: boolean;
  setIsPublic: Dispatch<SetStateAction<boolean>>;
}) {
  const updateDefaultWorkspace = hooks.useUpdateDefaultWorkspace();
  const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);
  const privateText =
    selectedWorkspaceId === null ? (
      `Only you can view this Replay`
    ) : (
      <span>
        This replay can be viewed by anyone from{" "}
        <span className="font-semibold">{selectedWorkspace!.name}</span>
      </span>
    );
  const handleWorkspaceSelect = (id: string | null) => {
    updateDefaultWorkspace({
      variables: { workspaceId: id },
    });
    setSelectedWorkspaceId(id);
  };

  return (
    <>
      {workspaces.length ? (
        <div className="">
          <label className="block text-xs uppercase font-semibold">Team</label>
          <TeamSelect {...{ workspaces, handleWorkspaceSelect, selectedWorkspaceId }} />
        </div>
      ) : null}
      <div className="space-y-2 text-sm">
        <label className="block text-xs uppercase font-semibold">Privacy</label>
        <div className="space-y-1">
          <div className="space-x-2 items-center">
            <input
              type="radio"
              name="privacy"
              value="public"
              id="public"
              checked={isPublic}
              onChange={() => setIsPublic(true)}
            />
            <label htmlFor="public">
              <span className="font-semibold">Public: </span>This replay can be viewed by anyone
              with the link
            </label>
          </div>
          <div className="space-x-2 items-center">
            <input
              type="radio"
              name="privacy"
              value="private"
              id="private"
              checked={!isPublic}
              onChange={() => setIsPublic(false)}
            />
            <label htmlFor="private">
              <span className="font-semibold">Private: </span>
              {privateText}
            </label>
          </div>
        </div>
      </div>
    </>
  );
}

function SharingPreview({
  toggleShowSharingSettings,
  isPublic,
  workspaces,
  selectedWorkspaceId,
}: {
  toggleShowSharingSettings: () => void;
  isPublic: boolean;
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
}) {
  const personalWorkspace = { id: null, name: "My Library" };
  const workspaceName = [...workspaces, personalWorkspace].find(w => w.id === selectedWorkspaceId)!
    .name;
  let icon;
  let text;

  if (!isPublic) {
    if (selectedWorkspaceId) {
      text = `Shared privately with ${workspaceName}`;
      icon = "groups";
    } else {
      text = `Only you can view this`;
      icon = "person";
    }
  } else {
    text = "This replay can be viewed by anyone with the link";
    icon = "public";
  }

  return (
    <div className="flex flex-row items-center space-x-4 text-sm">
      <span className="material-icons">{icon}</span>
      <div className="flex flex-col flex-grow overflow-hidden">
        <div className="overflow-hidden overflow-ellipsis whitespace-pre">{text}</div>
      </div>
      <button
        type="button"
        className="text-blue-700 underline p-2"
        onClick={toggleShowSharingSettings}
      >
        Edit
      </button>
    </div>
  );
}

export default function UploadScreen({ recording, userSettings }: UploadScreenProps) {
  const recordingId = useGetRecordingId();
  const [showSharingSettings, setShowSharingSettings] = useState(false);
  // This is pre-loaded in the parent component.
  const { screenData, loading: loading1 } = hooks.useGetRecordingPhoto(recordingId!);
  const { workspaces, loading: loading2 } = hooks.useGetNonPendingWorkspaces();

  const [status, setStatus] = useState<Status>(null);
  const [inputValue, setInputValue] = useState(recording?.title || "Untitled");
  // The actual replay in the database is public by default, for test purposes.
  // Before being initialized, public/private behaves similarly since non-authors
  // can't view the replay.
  const [isPublic, setIsPublic] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    userSettings?.defaultWorkspaceId || null
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

  const toggleShowSharingSettings = () => setShowSharingSettings(!showSharingSettings);

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

  // Soft limit is set at 2 minutes.
  const showLimitWarning = recording.duration > 120 * 1000;

  return (
    <div className="w-full h-full" style={{ background: "" }}>
      <Modal>
        <div
          className="p-12 bg-white rounded-lg shadow-xl text-lg space-y-12 relative flex flex-col justify-between overflow-y-auto"
          style={{ width: "520px", maxHeight: "90vh" }}
        >
          <h2 className="font-bold text-2xl ">Save and Upload</h2>
          <form className="space-y-6" onSubmit={e => onSubmit(e)}>
            <ReplayTitle inputValue={inputValue} setInputValue={setInputValue} />
            <ReplayPreview recording={recording} screenData={screenData!} />
            {showSharingSettings ? (
              <SharingSettings
                workspaces={workspaces}
                selectedWorkspaceId={selectedWorkspaceId}
                setSelectedWorkspaceId={setSelectedWorkspaceId}
                isPublic={isPublic}
                setIsPublic={setIsPublic}
              />
            ) : (
              <SharingPreview
                {...{ toggleShowSharingSettings, isPublic, workspaces, selectedWorkspaceId }}
              />
            )}
            {showLimitWarning ? <SoftLimitWarning /> : null}
            <Actions onDiscard={onDiscard} status={status} />
          </form>
          <UploadRecordingTrialEnd {...{ selectedWorkspaceId, workspaces }} />
        </div>
      </Modal>
    </div>
  );
}
