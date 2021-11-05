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
      className="flex items-center space-x-1.5 px-4 py-4 rounded-lg text-white bg-primaryAccent hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent h-8 mr-0 sharebutton"
    >
      <MaterialIcon style={{ fontSize: "16px" }}>ios_share</MaterialIcon>
      <div>Share</div>
    </button>
  );
}

const connector = connect(null, {
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ShareButton);
