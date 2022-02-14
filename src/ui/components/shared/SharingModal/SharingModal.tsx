import React from "react";
import { connect, ConnectedProps } from "react-redux";
import Modal from "ui/components/shared/NewModal";
import { CopyButton } from "./ReplayLink";
import hooks from "ui/hooks";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import { CollaboratorRequest, Recording } from "ui/types";
import { actions } from "ui/actions";
import Collaborators from "./Collaborators";
import MaterialIcon from "../MaterialIcon";
import PrivacyDropdown from "./PrivacyDropdown";
import { AvatarImage } from "ui/components/Avatar";
import { PrimaryButton } from "../Button";
import { useHasNoRole } from "ui/hooks/recordings";

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
      <div className="overflow-auto space-y-1.5" style={{ maxHeight: "160px" }}>
        {displayedRequests.map((c, i) => (
          <div
            className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg justify-between"
            key={i}
          >
            <div className="flex items-center space-x-2">
              <div className="w-8 flex-shrink-0 rounded-full overflow-hidden">
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
      <div className="w-full justify-between flex flex-col space-y-3">
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

function SharingModal({ recording, hideModal }: SharingModalProps) {
  return (
    <Modal options={{ maskTransparency: "translucent" }} onMaskClick={hideModal}>
      <div
        className="sharing-modal space-y-0 relative flex flex-col bg-white rounded-lg text-sm overflow-hidden"
        style={{ width: "460px" }}
      >
        <CollaboratorsSection recording={recording} />
        <section className="p-8 flex flex-row space-x-2 bg-gray-100 items-center justify-between">
          <div className="flex flex-row space-x-3 items-center overflow-hidden">
            <div className="h-8 w-8 bg-purple-200 rounded-full font-bold flex-shrink-0 flex items-center justify-center">
              <MaterialIcon className="text-purple-600" iconSize="xl">
                people
              </MaterialIcon>
            </div>
            <div className="flex flex-col space-y-1 overflow-hidden">
              <div className="font-bold">Privacy Settings</div>
              <PrivacyDropdown {...{ recording }} />
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
