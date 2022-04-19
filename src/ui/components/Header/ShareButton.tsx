import React from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import { useGetRecordingId } from "ui/hooks/recordings";
import { trackEvent } from "ui/utils/telemetry";

import MaterialIcon from "../shared/MaterialIcon";

function ShareButton({ setModal }: PropsFromRedux) {
  const recordingId = useGetRecordingId();
  const onClick = () => {
    trackEvent("header.open_share");
    setModal("sharing", { recordingId: recordingId! });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="mr-0 flex items-center space-x-1.5 rounded-lg bg-primaryAccent text-white hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-primaryAccent focus:ring-offset-2"
      style={{ padding: "5px 12px" }}
    >
      <MaterialIcon style={{ fontSize: "16px" }}>ios_share</MaterialIcon>
      <div className="text-sm">Share</div>
    </button>
  );
}

const connector = connect(null, {
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ShareButton);
