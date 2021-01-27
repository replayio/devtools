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
      <Modal>
        <div className="row title">
          <div className="img login" />
          <p>Login</p>
        </div>
        <div className="row description">You need to be logged in to add a comment.</div>
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
