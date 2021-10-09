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
      style={{
        background: "var(--cool-gray-200)",
        color: "rgba(0, 0, 0, 0.5)",
        padding: "7.5px",
      }}
      className="inline-flex items-center p-1.5 border-bg-blue-100 rounded-lg text-black-700 hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent h-8 mr-0 sharebutton"
    >
      {/* Share */}
      <span className="text-sm material-icons-outlined">share</span>
    </button>
  );
}

const connector = connect(null, {
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ShareButton);
