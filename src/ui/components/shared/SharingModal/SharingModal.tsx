import { ScreenShot } from "@replayio/protocol";
import React, { useEffect, useRef, useState } from "react";
import { ConnectedProps, connect } from "react-redux";

import { getGraphicsAtTime } from "protocol/graphics";
import { actions } from "ui/actions";
import { AvatarImage } from "ui/components/Avatar";
import Modal from "ui/components/shared/NewModal";
import {
  Privacy,
  ToggleShowPrivacyButton,
  getUniqueDomains,
} from "ui/components/UploadScreen/Privacy";
import hooks from "ui/hooks";
import { getRecording, useHasNoRole } from "ui/hooks/recordings";
import * as selectors from "ui/reducers/app";
import { getRecordingTarget } from "ui/reducers/app";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";
import { UIState } from "ui/state";
import { OperationsData } from "ui/types";
import { CollaboratorRequest, Recording } from "ui/types";
import useToken from "ui/utils/useToken";

import { PrimaryButton } from "../Button";
import MaterialIcon from "../MaterialIcon";
import Collaborators from "./Collaborators";
import PrivacyDropdown from "./PrivacyDropdown";
import { CopyButton } from "./ReplayLink";
import styles from "./SharingModal.module.css";

function SharingModalWrapper(props: PropsFromRedux) {
  const opts = props.modalOptions;
  const recordingId = opts && "recordingId" in opts ? opts.recordingId : "";
  const { recording, loading } = hooks.useGetRecording(recordingId);

  if (loading || !recording) {
    // Todo: Use an actual loader here
    return null;
  }

  return <SharingModal {...props} recording={recording} />;
}

type SharingModalProps = PropsFromRedux & {
  recording: Recording;
};

function CollaboratorRequests({ recording }: { recording: Recording }) {
  const acceptRecordingRequest = hooks.useAcceptRecordingRequest();
  const { collaboratorRequests } = recording;

  if (!collaboratorRequests?.length) {
    return null;
  }

  // Remove duplicates
  const displayedRequests = collaboratorRequests.reduce((acc: CollaboratorRequest[], request) => {
    const userMatch = acc.find(r => r.user.id === request.user.id);

    return userMatch ? acc : [...acc, request];
  }, []);

  return (
    <section className="space-y-1.5">
      <div className="font-bold">Requests to access this replay</div>
      <div className="space-y-1.5 overflow-auto" style={{ maxHeight: "160px" }}>
        {displayedRequests.map((c, i) => (
          <div
            className="hover:bg-theme-base-90 flex items-center justify-between space-x-2 rounded-lg p-2"
            key={i}
          >
            <div className="flex items-center space-x-2">
              <div className="w-8 flex-shrink-0 overflow-hidden rounded-full">
                <AvatarImage src={c.user.picture} />
              </div>
              <span className="overflow-hidden overflow-ellipsis whitespace-pre">
                {c.user.name}
              </span>
            </div>
            <PrimaryButton color="blue" onClick={() => acceptRecordingRequest(c.id)}>
              Add
            </PrimaryButton>
          </div>
        ))}
      </div>
    </section>
  );
}

function CollaboratorsSection({ recording }: { recording: Recording }) {
  const { hasNoRole, loading } = useHasNoRole();

  if (hasNoRole || loading) {
    return null;
  }

  return (
    <section className="space-y-4 bg-modalBgcolor p-4">
      <div className="flex w-full flex-col justify-between space-y-3">
        <div className="w-full space-y-4">
          <div>
            <div className="font-bold">Team</div>

            <div className="rounded-md border border border-transparent bg-themeTextFieldBgcolor p-2 hover:bg-themeTextFieldBgcolorHover">
              <PrivacyDropdown {...{ recording }} />
            </div>
            <div className="mt-4 font-bold">Add People</div>

            <Collaborators recordingId={recording.id} />
          </div>
          <CollaboratorRequests recording={recording} />
        </div>
      </div>
    </section>
  );
}

function SecurityWarnings({ operations }: { operations: OperationsData }) {
  const uniqueDomains = getUniqueDomains(operations);

  if (uniqueDomains.length == 0) {
    return null;
  }

  return (
    <div className="group">
      <div className="text-xs">{`Contains potentially sensitive data from ${uniqueDomains.length} domains`}</div>
    </div>
  );
}

function EnvironmentVariablesRow() {
  return <div className="text-xs">This node recording contains all env variables</div>;
}

function SharingSection({
  recording,
  showEnvironmentVariables,
  showPrivacy,
  setShowPrivacy,
}: {
  recording: Recording;
  showEnvironmentVariables: boolean;
  showPrivacy: boolean;
  setShowPrivacy: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <>
      <CollaboratorsSection recording={recording} />
      <section className="flex flex-col bg-menuHoverBgcolor px-4 pb-5 pt-3">
        <div className="mb-2 font-bold">Sharing Options</div>

        <div className="flex">
          <div className="mr-2">
            <CopyButton recording={recording} />
          </div>
          <div>
            <DownloadSection recording={recording} />
          </div>
        </div>
        <div>
          {!recording.private && recording.operations && (
            <ToggleShowPrivacyButton
              showPrivacy={showPrivacy}
              operations={recording.operations}
              setShowPrivacy={setShowPrivacy}
            />
          )}
        </div>
      </section>
    </>
  );
}

type ModalMode = "sharing" | "download";

function Header({
  modalMode,
  setModalMode,
}: {
  modalMode: ModalMode;
  setModalMode: React.Dispatch<React.SetStateAction<ModalMode>>;
}) {
  const Tab = ({
    label,
    onClick,
    active,
    className = "",
  }: {
    label: string;
    onClick: any;
    active: boolean;
    className?: string;
  }) => (
    <div
      onClick={onClick}
      className={
        (active
          ? "rounded-xl bg-menuHoverBgcolor px-4 py-1 font-bold text-slate-700 hover:text-slate-800"
          : "text-slate-500 hover:text-slate-600") + ` ${className} cursor-pointer`
      }
    >
      {label}
    </div>
  );

  return <section></section>;
}

function DownloadSection({ recording }: { recording: Recording }) {
  const token = useToken();
  const currentTime = useAppSelector(getCurrentTime);
  const [screen, setScreen] = useState<ScreenShot | null>(null);

  const [downloadState, setDownloadState] = useState<
    "not-started" | "downloading" | "success" | "error"
  >("not-started");

  useEffect(() => {
    getGraphicsAtTime(currentTime).then(res => res.screen && setScreen(res.screen));
  }, [currentTime]);

  const buttonStates = {
    "not-started": {
      label: "Download as video",
      icon: "download",
    },
    downloading: {
      label: "Downloading video ...",
      icon: "loop",
    },
    success: {
      label: "Video downloaded",
      icon: "check",
    },
    error: {
      label: "Failed to download",
      icon: "error",
    },
  };

  const onDownload = () => {
    console.log(`Download recording ${recording.id}`);

    const xhr = new XMLHttpRequest();
    xhr.responseType = "blob";
    xhr.onload = function () {
      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(xhr.response);
      setDownloadState("success");

      a.download = "replay.mp4";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    xhr.onerror = function () {
      console.error(`Failed to download video ${recording.id}`);
      setDownloadState("error");
    };
    xhr.open("POST", "/api/video");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify({ recordingId: recording.id, token: token.token }));
    setDownloadState("downloading");
  };

  return (
    <div>
      <button className={styles.downloadVideo} onClick={onDownload}>
        <MaterialIcon className={`mr-2 ${downloadState === "downloading" ? "animate-spin" : ""}`}>
          {buttonStates[downloadState].icon}
        </MaterialIcon>
        {buttonStates[downloadState].label}
      </button>
    </div>
  );
}

function SharingModal({ recording, hideModal }: SharingModalProps) {
  const recordingTarget = useAppSelector(getRecordingTarget);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("sharing");
  const showEnvironmentVariables = recordingTarget == "node";

  return (
    <Modal options={{ maskTransparency: "translucent" }} onMaskClick={hideModal}>
      <div
        className="sharing-modal relative flex flex-row overflow-hidden rounded-lg text-sm shadow-xl"
        style={{ width: showPrivacy ? 720 : 390 }}
      >
        <div className="flex flex-col space-y-0" style={{ width: 390 }}>
          <Header modalMode={modalMode} setModalMode={setModalMode} />
          {modalMode == "sharing" ? (
            <>
              <SharingSection
                recording={recording}
                showEnvironmentVariables={showEnvironmentVariables}
                showPrivacy={showPrivacy}
                setShowPrivacy={setShowPrivacy}
              />
            </>
          ) : null}
        </div>
        {showPrivacy ? (
          <div className="relative flex overflow-auto bg-menuHoverBgcolor">
            <Privacy />
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

const connector = connect(
  (state: UIState) => ({
    modalOptions: selectors.getModalOptions(state),
  }),
  {
    hideModal: actions.hideModal,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(SharingModalWrapper);
