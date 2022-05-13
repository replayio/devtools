import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import { useUpdateDefaultWorkspace } from "ui/hooks/settings";
import useAuth0 from "ui/utils/useAuth0";

import { replayRecording } from "stress-test/stress";

function TeamPage({ setWorkspaceId, setModal }: PropsFromRedux) {
  const { query, replace } = useRouter();
  const { isAuthenticated } = useAuth0();

  window.replayRecording = replayRecording;
  console.log("stress test", query);

  const workspaceId = query.id;

  useEffect(() => {
    if (isAuthenticated && workspaceId) {
      replayRecording(query.recordingId);
    }
  }, [isAuthenticated, workspaceId]);

  return (
    <div>
      <h1>Hello</h1>
    </div>
  );
}

const connector = connect(null, {
  setWorkspaceId: actions.setWorkspaceId,
  setModal: actions.setModal,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(TeamPage);
