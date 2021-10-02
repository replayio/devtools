import React from "react";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { TrialEnd } from "../shared/TrialEnd";

function TeamTrialEnd({ currentWorkspaceId }: PropsFromRedux) {
  const { workspaces, loading } = hooks.useGetNonPendingWorkspaces();

  // There's no workspace ID if they are in their personal library.
  if (loading || !currentWorkspaceId) {
    return null;
  }

  const workspace = workspaces.find(w => w.id === currentWorkspaceId);

  if (!workspace?.subscription?.trialEnds) {
    return null;
  }

  return <TrialEnd trialEnds={workspace.subscription.trialEnds} color="yellow" />;
}

const connector = connect((state: UIState) => ({
  currentWorkspaceId: selectors.getWorkspaceId(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(TeamTrialEnd);
