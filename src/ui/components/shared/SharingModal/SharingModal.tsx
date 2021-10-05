import React from "react";
import { connect, ConnectedProps } from "react-redux";
import Modal from "ui/components/shared/NewModal";
import { CopyButton } from "./ReplayLink";
import hooks from "ui/hooks";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import { Recording } from "ui/types";
import { actions } from "ui/actions";
import Collaborators from "./Collaborators";
import MaterialIcon from "../MaterialIcon";
import PrivacyDropdown from "./PrivacyDropdown";

function SharingModalWrapper(props: PropsFromRedux) {
  const { recordingId } = props.modalOptions!;
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

function SharingModal({ recording, hideModal }: SharingModalProps) {
  return (
    <Modal options={{ maskTransparency: "translucent" }} onMaskClick={hideModal}>
      <div
        className="sharing-modal space-y-0 relative flex flex-col bg-white rounded-lg text-sm overflow-hidden"
        style={{ width: "460px" }}
      >
        <section className="p-8 space-y-4">
          <div className="w-full justify-between flex flex-col space-y-3">
            <div className="w-full space-y-1.5">
              <div className="font-bold">Add People</div>
              <Collaborators recordingId={recording.id} />
            </div>
          </div>
        </section>
        <section className="p-8 flex flex-row space-x-2 bg-gray-100 items-center justify-between">
          <div className="flex flex-row space-x-3 items-center overflow-hidden">
            <div className="h-8 w-8 bg-purple-200 rounded-full font-bold flex-shrink-0 flex items-center justify-center">
              <MaterialIcon className="text-purple-600">people</MaterialIcon>
            </div>
            <div className="flex flex-col space-y-1 overflow-hidden">
              <div className="font-bold">Privacy Settings</div>
              <PrivacyDropdown {...{ recording }} />
            </div>
          </div>
          <CopyButton recordingId={recording.id} />
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
