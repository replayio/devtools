import React from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import { useGetRecordingId } from "ui/hooks/recordings";
import { trackEvent } from "ui/utils/telemetry";

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
      className="inline-flex items-center px-4 py-1.5 border-2 border-bg-blue-100 rounded-lg text-black-700 bg-white hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent h-8 mr-0 sharebutton"
    >
      Share
    </button>
  );
}

const connector = connect(null, {
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ShareButton);
