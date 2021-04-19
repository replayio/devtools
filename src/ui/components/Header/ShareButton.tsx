import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";

function ShareButton({ setModal, recordingId }: PropsFromRedux) {
  const onClick = () => setModal("sharing", { recordingId: recordingId! });

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center px-4 py-2 border border-blue-500 shadow-sm text-lg font-lg rounded-md text-blue-500 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      Share
    </button>
  );
}

const connector = connect((state: UIState) => ({ recordingId: selectors.getRecordingId(state) }), {
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ShareButton);
