import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { useAppSelector } from "ui/setup/hooks";
import Modal from "ui/components/shared/NewModal";
import { CopyButton } from "./ReplayLink";
import hooks from "ui/hooks";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import { OperationsData } from "ui/types";
import { getUniqueDomains } from "ui/components/UploadScreen/Privacy";
import { CollaboratorRequest, Recording } from "ui/types";
import { actions } from "ui/actions";
import Collaborators from "./Collaborators";
import MaterialIcon from "../MaterialIcon";
import PrivacyDropdown from "./PrivacyDropdown";
import { AvatarImage } from "ui/components/Avatar";
import { PrimaryButton } from "../Button";
import { useHasNoRole } from "ui/hooks/recordings";
import { getRecordingTarget } from "ui/reducers/app";

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
            className="flex items-center justify-between p-2 space-x-2 rounded-lg hover:bg-theme-base-90"
            key={i}
          >
            <div className="flex items-center space-x-2">
              <div className="flex-shrink-0 w-8 overflow-hidden rounded-full">
                <AvatarImage src={c.user.picture} />
              </div>
              <span className="overflow-hidden whitespace-pre overflow-ellipsis">
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
    <section className="p-8 space-y-4">
      <div className="flex flex-col justify-between w-full space-y-3">
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

function SecurityWarnings({
  operations,
  onClick,
}: {
  operations: OperationsData;
  onClick: () => void;
}) {
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
  const showEnvironmentVariables = recordingTarget == "node";

  return (
    <Modal options={{ maskTransparency: "translucent" }} onMaskClick={hideModal}>
      <div
        className="relative flex flex-col space-y-0 overflow-hidden text-sm rounded-lg sharing-modal"
        style={{ width: "460px" }}
      >
        <CollaboratorsSection recording={recording} />
        <section className="flex flex-row items-center justify-between p-8 space-x-2 bg-menuHoverBgcolor">
          <div className="flex flex-row items-start space-x-3 overflow-hidden">
            <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 mt-1 font-bold bg-blue-200 rounded-full">
              <MaterialIcon className="text-blue-600" iconSize="xl">
                people
              </MaterialIcon>
            </div>
            <div className="flex flex-col space-y-1 overflow-hidden">
              <div className="font-bold">Privacy Settings</div>
              <PrivacyDropdown {...{ recording }} />
              {recording.operations ? (
                <SecurityWarnings operations={recording.operations} onClick={() => {}} />
              ) : null}
              {showEnvironmentVariables ? <EnvironmentVariablesRow /> : null}
            </div>
          </div>
          <CopyButton recording={recording} />
        </section>
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
