import React from "react";
import { ConnectedProps, connect } from "react-redux";

import { useNag } from "replay-next/src/hooks/useNag";
import { Nag } from "shared/graphql/types";
import * as actions from "ui/actions/app";
import { useGetRecordingId, useHasNoRole } from "ui/hooks/recordings";
import { trackEvent } from "ui/utils/telemetry";

import MaterialIcon from "../shared/MaterialIcon";

function ShareButton({ setModal }: PropsFromRedux) {
  const recordingId = useGetRecordingId();
  const [, dismissShareNag] = useNag(Nag.SHARE); // Properly call useNag and destructure dismissShareNag

  const { hasNoRole, loading } = useHasNoRole();
  if (hasNoRole || loading) {
    return null;
  }

  const onClick = () => {
    trackEvent("header.open_share");
    dismissShareNag();
    setModal("sharing", { recordingId: recordingId! });
  };

  return (
    <button type="button" onClick={onClick} className="rounded-md px-3 py-2 hover:bg-accent">
      <MaterialIcon style={{ fontSize: "20px" }}>ios_share</MaterialIcon>
    </button>
  );
}

const connector = connect(null, {
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ShareButton);
