import React from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";

const { features } = require("ui/utils/prefs");

function ShareButton({ setModal, recordingId }: PropsFromRedux) {
  const onClick = () => {
    console.log("hi");
    throw new Error("AHHHHHH");
  };

  if (window.__IS_RECORD_REPLAY_RUNTIME__ || !features.launchBrowser) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      // This height matches the height of the icon button + border
      style={{ height: 26 }}
      className="inline-flex items-center px-6 rounded-full text-white bg-primaryAccent hover:bg-primaryAccentHover hover:bg-primaryAccent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white box-content mr-2"
    >
      Launch Replay
    </button>
  );
}

const connector = connect((state: UIState) => ({ recordingId: selectors.getRecordingId(state) }), {
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ShareButton);
