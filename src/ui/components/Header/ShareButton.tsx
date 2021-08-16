import React from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import { useGetRecordingId } from "ui/hooks/recordings";

function ShareButton({ setModal }: PropsFromRedux) {
  const recordingId = useGetRecordingId();
  const onClick = () => setModal("sharing", { recordingId: recordingId! });

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center px-6 py-2 border-2 border-bg-blue-100 text-xl rounded-xl text-black-700 bg-white hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent h-11 mr-0 sharebutton"
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
