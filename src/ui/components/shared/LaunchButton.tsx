import React from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import { features } from "ui/utils/prefs";
import { trackEvent } from "ui/utils/telemetry";

import { PrimaryButton } from "../shared/Button";

function ShareButton({ setModal }: PropsFromRedux) {
  const onClick = () => {
    trackEvent("onboarding.launch_replay");
    setModal("browser-launch");
  };

  if (window.__IS_RECORD_REPLAY_RUNTIME__) {
    return null;
  }

  return (
    <PrimaryButton color="blue" onClick={onClick}>
      <div className="flex flex-row items-center space-x-2">
        <div className="material-icons" style={{ fontSize: "1rem" }}>
          open_in_new
        </div>
        <div>Launch Replay</div>
      </div>
    </PrimaryButton>
  );
}

const connector = connect(null, {
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ShareButton);
