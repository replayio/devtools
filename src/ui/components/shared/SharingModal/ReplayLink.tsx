import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { selectors } from "ui/reducers";
import "./ReplayLink.css";

function ReplayLink({ recordingId }: PropsFromRedux) {
  return (
    <div className="copy-link">
      <input
        type="text"
        value={`https://replay.io/view?id=${recordingId}`}
        onKeyPress={e => e.preventDefault()}
        onChange={e => e.preventDefault()}
      />
    </div>
  );
}

const connector = connect((state: UIState) => ({
  recordingId: selectors.getRecordingId(state),
}));

type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ReplayLink);
