import classNames from "classnames";
import React from "react";
import { ConnectedProps, connect } from "react-redux";

import { userData } from "shared/user-data/GraphQL/UserData";
import * as actions from "ui/actions/app";
import { setSelectedPrimaryPanel } from "ui/actions/layout";
import { isTestSuiteReplay } from "ui/components/TestSuite/utils/isTestSuiteReplay";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { getSelectedSource } from "ui/reducers/sources";
import { UIState } from "ui/state";

import { PrimaryButton, SecondaryButton } from "../Button";
import { Dialog, DialogActions, DialogDescription, DialogLogo, DialogTitle } from "../Dialog";
import Modal from "../NewModal";

function SourcemapSetupModal({
  hideModal,
  setSelectedPrimaryPanel,
  selectedSource,
}: PropsFromRedux) {
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);

  const onClickOk = () => {
    let initialPrimaryPanel;
    userData.set("feature_showPassport", false);
    if (recording && isTestSuiteReplay(recording)) {
      initialPrimaryPanel = "cypress";
    } else {
      initialPrimaryPanel = "events";
    }
    setSelectedPrimaryPanel(initialPrimaryPanel);
    hideModal();
  };

  const onClickDismiss = () => {
    hideModal();
  };

  return (
    <Modal options={{ maskTransparency: "translucent" }} onMaskClick={hideModal}>
      <Dialog showFooterLinks={false}>
        <DialogTitle>Dismiss Passport? </DialogTitle>
        <DialogDescription>
          Passport can be re-enabled from settings if you'd like.
        </DialogDescription>
        <DialogActions>
          <div className="flex w-full flex-col items-center">
            <PrimaryButton color="blue" onClick={onClickOk}>
              OK
            </PrimaryButton>
            <SecondaryButton color="gray" onClick={onClickDismiss}>
              Cancel
            </SecondaryButton>
          </div>
        </DialogActions>
      </Dialog>
    </Modal>
  );
}

const connector = connect(
  (state: UIState) => ({
    selectedSource: getSelectedSource(state)!,
  }),
  {
    hideModal: actions.hideModal,
    setSelectedPrimaryPanel,
  }
);

type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(SourcemapSetupModal);
