import { ConnectedProps, connect } from "react-redux";

import { Button } from "replay-next/components/Button";
import * as actions from "ui/actions/app";
import { trackEvent } from "ui/utils/telemetry";

function ShareButton({ setModal }: PropsFromRedux) {
  const onClick = () => {
    trackEvent("onboarding.launch_replay");
    setModal("browser-launch");
  };

  if (window.__IS_RECORD_REPLAY_RUNTIME__) {
    return null;
  }

  return (
    <Button onClick={onClick}>
      <div className="flex flex-row items-center space-x-2">
        <div className="material-icons" style={{ fontSize: "1rem" }}>
          open_in_new
        </div>
        <div>Launch Replay</div>
      </div>
    </Button>
  );
}

const connector = connect(null, {
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ShareButton);
