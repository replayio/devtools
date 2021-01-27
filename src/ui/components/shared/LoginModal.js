import React from "react";
import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import Modal from "ui/components/shared/Modal";
import LoginButton from "ui/components/LoginButton";

import "./LoginModal.css";

function LoginModal() {
  return (
    <div className="login-modal">
      <Modal showClose={false}>
        <div className="row title">Login to Replay</div>
        <div className="bottom">
          <LoginButton />
        </div>
      </Modal>
    </div>
  );
}

export default connect(
  state => ({
    modal: selectors.getModal(state),
    recordingId: selectors.getRecordingId(state),
  }),
  { hideModal: actions.hideModal }
)(LoginModal);
