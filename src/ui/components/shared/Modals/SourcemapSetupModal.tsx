import classNames from "classnames";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import { PrimaryButton } from "../Button";
import { Dialog, DialogActions, DialogDescription, DialogLogo, DialogTitle } from "../Dialog";
import Modal from "../NewModal";

function SourcemapSetupModal({ hideModal }: PropsFromRedux) {
  const onClick = () => {
    window.open("https://replayio.notion.site/Adding-Source-Maps-1923e679c1e4411db1bda29536eb1e31");
  };

  return (
    <Modal options={{ maskTransparency: "translucent" }} onMaskClick={hideModal}>
      <Dialog
        className={classNames("flex flex-col items-center")}
        style={{ animation: "dropdownFadeIn ease 200ms", width: 400 }}
      >
        <DialogLogo />
        <DialogTitle>Replay is better with sourcemaps</DialogTitle>
        <DialogDescription>
          {`We noticed that you have sourcemaps, but they haven't been uploaded to our servers yet.
          Ready to get started?`}
        </DialogDescription>
        <DialogActions>
          <div className="w-full flex flex-col items-center">
            <PrimaryButton color="blue" onClick={onClick}>{`Show me how`}</PrimaryButton>
          </div>
        </DialogActions>
      </Dialog>
    </Modal>
  );
}

const connector = connect(null, { hideModal: actions.hideModal });
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(SourcemapSetupModal);
