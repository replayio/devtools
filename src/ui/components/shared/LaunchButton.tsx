import React from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import { features } from "ui/utils/prefs";

function ShareButton({ setModal }: PropsFromRedux) {
  const onClick = () => setModal("browser-launch");

  if (window.__IS_RECORD_REPLAY_RUNTIME__ || !features.launchBrowser) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      // This height matches the height of the icon button + border
      style={{ height: 26 }}
      className="inline-flex items-center px-4 text-xs rounded-lg text-white bg-primaryAccent hover:bg-primaryAccent hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white box-content mr-2"
    >
      Launch Replay
    </button>
  );
}

const connector = connect(null, {
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ShareButton);
