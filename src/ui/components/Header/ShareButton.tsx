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
    <button
      type="button"
      onClick={onClick}
      className="mr-0 flex items-center space-x-1.5 rounded-lg bg-primaryAccent text-buttontextColor hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-primaryAccent focus:ring-offset-2"
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
