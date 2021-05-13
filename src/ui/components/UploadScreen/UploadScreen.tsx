import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { connect, ConnectedProps } from "react-redux";
import { getRecordingId } from "ui/reducers/app";
import { UIState } from "ui/state";
import hooks from "ui/hooks";
import TeamSelect from "./TeamSelect";
const { getFormattedTime } = require("ui/utils/timeline");
import ReplayTitle from "./ReplayTitle";
import { selectors } from "ui/reducers";
import classNames from "classnames";
import Modal from "ui/components/shared/NewModal";
import { Recording, Workspace } from "ui/types";
import { BlankLoadingScreen } from "../shared/BlankScreen";

type UploadScreenProps = PropsFromRedux & { recording: Recording };
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
    <div
      className="w-full h-full"
      style={{ background: "linear-gradient(to bottom right, #68DCFC, #4689F8)" }}
    >
      <Modal>
        <div
          className="p-12 bg-white rounded-lg shadow-xl text-lg space-y-12 relative flex flex-col justify-between"
          style={{ width: "400px" }}
        >
          <h2 className="font-bold text-3xl text-gray-900">{`Redirecting...`}</h2>
          <div className="text-gray-500 space-y-6 text-xl">
            <div>{`Sit tight! We'll bring you back to that website in a few seconds.`}</div>
          </div>
          <div className="space-y-1">
            <div className="overflow-hidden overflow-ellipsis whitespace-pre text-base text-gray-500">
              {url}
            </div>
            <button
              type="button"
              onClick={navigateToUrl}
              className={classNames(
                "inline-flex items-center px-4 py-2 border border-transparent text-lg font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 justify-center",
                "text-white bg-blue-600 hover:bg-blue-700"
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

  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        onClick={onDiscard}
        disabled={isSaving || isDeleting}
        className={classNames(
          "inline-flex items-center px-4 py-2 border border-gray-200 text-lg font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 justify-center",
          "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        )}
      >
        {isDeleting ? `Discarding…` : `Discard`}
      </button>
      <input
        type="submit"
        disabled={isSaving || isDeleting}
        value={isSaving ? `Uploading…` : `Save & Upload`}
        className={classNames(
          "inline-flex items-center px-4 py-2 border border-transparent text-lg font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 justify-center cursor-pointer",
          "text-white bg-blue-600 hover:bg-blue-700"
        )}
      ></input>
    </div>
  );
}

function Form({
  workspaces,
  inputValue,
  setInputValue,
  selectedWorkspaceId,
  setSelectedWorkspaceId,
  isPublic,
  setIsPublic,
}: {
  workspaces: Workspace[];
  inputValue: string;
  setInputValue: Dispatch<SetStateAction<string>>;
  selectedWorkspaceId: string | null;
  setSelectedWorkspaceId: Dispatch<SetStateAction<string | null>>;
  isPublic: boolean;
  setIsPublic: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <>
      <ReplayTitle inputValue={inputValue} setInputValue={setInputValue} />
      <div className="text-gray-700">
        <label className="block text-sm uppercase font-semibold ">Team</label>
        {workspaces.length ? (
          <TeamSelect
            {...{ workspaces, selectedWorkspaceId, setSelectedWorkspaceId, label: "Team" }}
          />
        ) : null}
      </div>
      <div className="text-gray-700 text-lg space-y-2">
        <label className="block text-sm uppercase font-semibold ">Privacy</label>
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
              <span className="font-semibold">Public:</span> Available to anyone with the link
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
              <span className="font-semibold">Private:</span> Available to people you choose
            </label>
          </div>
        </div>
      </div>
    </>
  );
}

function UploadScreen({ recordingId, recording }: UploadScreenProps) {
  const { userSettings, loading: loading1 } = hooks.useGetUserSettings();
  const { screenData, loading: loading2 } = hooks.useGetRecordingPhoto(recordingId!);
  const { workspaces, loading: loading3 } = hooks.useGetNonPendingWorkspaces();

  const [status, setStatus] = useState<Status>(null);
  const [inputValue, setInputValue] = useState(recording?.title || "Untitled");
  const [isPublic, setIsPublic] = useState(!recording.private);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    userSettings?.defaultWorkspaceId || null
  );

  const initializeRecording = hooks.useInitializeRecording();
  const updateIsPrivate = hooks.useUpdateIsPrivate();
  const deleteRecording = hooks.useDeleteRecording(() => setStatus("deleted"));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setStatus("saving");
    const workspaceId = selectedWorkspaceId == "" ? null : selectedWorkspaceId;

    await initializeRecording({
      variables: { recordingId, title: inputValue, workspaceId },
    });
    updateIsPrivate({ variables: { recordingId, isPrivate: !isPublic } });
  };
  const onDiscard = () => {
    setStatus("deleting");
    deleteRecording({ variables: { recordingId } });
  };

  if (loading1 || loading2 || loading3) {
    return <BlankLoadingScreen />;
  }

  if (status === "deleted") {
    return <DeletedScreen url={recording.url} />;
  }

  return (
    <div
      className="w-full h-full"
      style={{ background: "linear-gradient(to bottom right, #68DCFC, #4689F8)" }}
    >
      <Modal>
        <div
          className="p-12 bg-white rounded-lg shadow-xl text-lg space-y-12 relative flex flex-col justify-between"
          style={{ width: "520px" }}
        >
          <h2 className="font-bold text-3xl text-gray-900">Save and Upload</h2>
          <div
            className="relative bg-gray-100 border border-gray-300 rounded-lg"
            style={{ height: "200px" }}
          >
            <img src={screenData} className="h-full m-auto" />
            <div
              style={{ maxWidth: "50%" }}
              className="shadow-md bg-gray-500 text-white bottom-4 left-4 rounded-full px-3 py-0.5 absolute text-base select-none"
            >
              <div className="whitespace-pre overflow-hidden overflow-ellipsis">
                {recording.url}
              </div>
            </div>
            <div className="shadow-md bg-gray-500 text-white bottom-4 right-4 rounded-full px-3 py-0.5 absolute text-base select-none">
              {getFormattedTime(recording!.duration)}
            </div>
          </div>
          <form className="space-y-6" onSubmit={e => onSubmit(e)}>
            <Form
              workspaces={workspaces}
              inputValue={inputValue}
              setInputValue={setInputValue}
              selectedWorkspaceId={selectedWorkspaceId}
              setSelectedWorkspaceId={setSelectedWorkspaceId}
              isPublic={isPublic}
              setIsPublic={setIsPublic}
            />
            <Actions onDiscard={onDiscard} status={status} />
          </form>
        </div>
      </Modal>
    </div>
  );
}

const connector = connect((state: UIState) => ({
  recordingId: getRecordingId(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(UploadScreen);
