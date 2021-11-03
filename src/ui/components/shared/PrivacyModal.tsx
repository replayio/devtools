import React from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import { Privacy } from "../UploadScreen/Privacy";
import Modal from "./NewModal";

function PrivacyModal({ hideModal }: PropsFromRedux) {
  return (
    <Modal options={{ maskTransparency: "translucent" }} onMaskClick={hideModal}>
      <div style={{ width: "440px", height: "480px" }}>
        <Privacy />
      </div>
    </Modal>
  );
}

const connector = connect(() => ({}), { hideModal: actions.hideModal });
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(PrivacyModal);
