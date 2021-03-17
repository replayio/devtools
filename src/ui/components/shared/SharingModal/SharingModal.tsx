import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import hooks from "ui/hooks";
const Modal = require("ui/components/shared/Modal").default;
import { UIState } from "ui/state";
import EmailForm from "./EmailForm";
import CopyUrl from "./CopyUrl";
import RecordingPrivacy from "./RecordingPrivacy";
import CollaboratorsList from "./CollaboratorsList";
import "./SharingModal.css";

function Sharing({ modalOptions, hideModal }: PropsFromRedux) {
  const { recordingId } = modalOptions!;
  const { collaborators, recording, loading } = hooks.useGetOwnersAndCollaborators(recordingId);

  if (loading) {
    return <Modal />;
  } else if (!recording) {
    setTimeout(() => hideModal(), 2000);
    return (
      <Modal>
        <div className="row status">Can&apos;t fetch your sharing permissions at this time</div>
      </Modal>
    );
  }

  return (
    <Modal>
      <div className="row title">
        <div className="img invite" />
        <p>Sharing</p>
      </div>
      <CopyUrl recordingId={recordingId} />
      <RecordingPrivacy recordingId={recordingId} />
      <EmailForm recordingId={recordingId} />
      <CollaboratorsList
        recording={recording}
        collaborators={collaborators}
        recordingId={recordingId}
      />
      <div className="bottom">
        <div className="spacer" />
        <button className="done" onClick={hideModal}>
          <div className="content">Done</div>
        </button>
      </div>
    </Modal>
  );
}

const connector = connect(
  (state: UIState) => ({
    modalOptions: selectors.getModalOptions(state),
  }),
  { hideModal: actions.hideModal }
);

export type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Sharing);
