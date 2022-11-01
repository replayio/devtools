import React, { useState } from "react";
import { ConnectedProps, connect } from "react-redux";

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
import * as selectors from "ui/reducers/app";
import { getRecordingTarget } from "ui/reducers/app";
import { useAppSelector } from "ui/setup/hooks";
import { UIState } from "ui/state";
import { OperationsData } from "ui/types";
import { CollaboratorRequest, Recording } from "ui/types";

import { PrimaryButton } from "../Button";
import MaterialIcon from "../MaterialIcon";
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

function CollaboratorsSection({ recording }: { recording: Recording }) {
  const { hasNoRole, loading } = useHasNoRole();

  if (hasNoRole || loading) {
    return null;
  }

  return (
    <section className="space-y-4 bg-menuBgcolor p-8">
      <div className="flex w-full flex-col justify-between space-y-3">
        <div className="w-full space-y-4">
          <div className="space-y-1.5">
            <div className="font-bold">Add People</div>
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

function SharingModal({ recording, hideModal }: SharingModalProps) {
  const recordingTarget = useAppSelector(getRecordingTarget);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const showEnvironmentVariables = recordingTarget == "node";

  return (
    <Modal options={{ maskTransparency: "translucent" }} onMaskClick={hideModal}>
      <div
        className="sharing-modal relative flex flex-row overflow-hidden rounded-lg text-sm shadow-xl"
        style={{ width: showPrivacy ? 720 : 460 }}
      >
        <div className="flex flex-col space-y-0" style={{ width: 460 }}>
          <CollaboratorsSection recording={recording} />
          <section className="flex flex-grow flex-row items-center justify-between space-x-2 bg-menuHoverBgcolor px-8 pt-8">
            <div className="flex flex-row items-start space-x-3 overflow-hidden">
              <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-200 font-bold">
                <MaterialIcon className="text-blue-600" iconSize="xl">
                  people
                </MaterialIcon>
              </div>
              <div className="flex flex-col space-y-1 overflow-hidden">
                <div className="font-bold">Privacy Settings</div>
                <PrivacyDropdown {...{ recording }} />
                {showEnvironmentVariables ? <EnvironmentVariablesRow /> : null}
              </div>
            </div>
            <CopyButton recording={recording} />
          </section>
          {recording.operations ? (
            <section className="bg-menuHoverBgcolor px-8 pb-6">
              <ToggleShowPrivacyButton
                showPrivacy={showPrivacy}
                operations={recording.operations}
                setShowPrivacy={setShowPrivacy}
              />
            </section>
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
