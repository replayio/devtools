import React, { useState } from "react";
import { ConnectedProps, connect } from "react-redux";

import { CollaboratorRequest, OperationsData, Recording } from "shared/graphql/types";
import { actions } from "ui/actions";
import { AvatarImage } from "ui/components/Avatar";
import Modal from "ui/components/shared/NewModal";
import {
  Privacy,
  ToggleShowPrivacyButton,
  getUniqueDomains,
} from "ui/components/UploadScreen/Privacy";
import hooks from "ui/hooks";
import { useHasNoRole } from "ui/hooks/recordings";
import { getModalOptions, getRecordingTarget } from "ui/reducers/app";
import { useAppSelector } from "ui/setup/hooks";
import { UIState } from "ui/state";

import { PrimaryButton } from "../Button";
import Collaborators from "./Collaborators";
import PrivacyDropdown from "./PrivacyDropdown";
import { CopyButton } from "./ReplayLink";

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

function CollaboratorsSection({
  recording,
  showPrivacy,
  setShowPrivacy,
}: {
  recording: Recording;
  showPrivacy: boolean;
  setShowPrivacy: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { hasNoRole, loading } = useHasNoRole();

  if (hasNoRole || loading) {
    return null;
  }

  return (
    <section className="space-y-4 bg-modalBgcolor p-4">
      <div className="flex w-full flex-col justify-between space-y-3">
        <div className="w-full space-y-4">
          <div>
            <div className="mb-2 font-bold">Team</div>

            <div className="rounded-md border border-inputBorder bg-themeTextFieldBgcolor p-2 hover:bg-themeTextFieldBgcolorHover">
              <PrivacyDropdown recording={recording} />
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
      <CollaboratorsSection
        recording={recording}
        showPrivacy={showPrivacy}
        setShowPrivacy={setShowPrivacy}
      />
      <section className="flex flex-col bg-menuHoverBgcolor px-4 py-3">
        <CopyButton recording={recording} />
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

function SharingModal({ recording, hideModal }: SharingModalProps) {
  const recordingTarget = useAppSelector(getRecordingTarget);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("sharing");
  const showEnvironmentVariables = recordingTarget == "node";

  return (
    <Modal options={{ maskTransparency: "translucent" }} onMaskClick={hideModal}>
      <div
        className="sharing-modal relative flex flex-row overflow-hidden rounded-lg border border-inputBorder text-sm shadow-xl"
        style={{ width: showPrivacy ? 720 : 390 }}
      >
        <div className="flex flex-col space-y-0" style={{ width: 390 }}>
          <Header modalMode={modalMode} setModalMode={setModalMode} />
          {modalMode == "sharing" ? (
            <SharingSection
              recording={recording}
              showEnvironmentVariables={showEnvironmentVariables}
              showPrivacy={showPrivacy}
              setShowPrivacy={setShowPrivacy}
            />
          ) : null}
        </div>
        {showPrivacy ? (
          <div className="relative flex overflow-auto bg-themeBase-90">
            <Privacy />
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

const connector = connect(
  (state: UIState) => ({
    modalOptions: getModalOptions(state),
  }),
  {
    hideModal: actions.hideModal,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(SharingModalWrapper);
