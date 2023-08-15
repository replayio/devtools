import React from "react";
import { ConnectedProps, connect } from "react-redux";

import * as actions from "ui/actions/app";

import { Privacy } from "../UploadScreen/Privacy";
import Modal from "./NewModal";

function PrivacyModal({ hideModal }: PropsFromRedux) {
  return (
    <Modal options={{ maskTransparency: "translucent" }} onMaskClick={hideModal}>
      <div
        className="relative flex overflow-hidden rounded-xl border border-inputBorder bg-themeBase-100"
        style={{ width: "440px", height: "480px" }}
      >
        <Privacy />
      </div>
    </Modal>
  );
}

const connector = connect(null, { hideModal: actions.hideModal });
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(PrivacyModal);
