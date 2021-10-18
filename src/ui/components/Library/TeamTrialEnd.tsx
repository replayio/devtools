import { subscriptionManager } from "framer-motion/types/utils/subscription-manager";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { useHistory } from "react-router";
import { actions } from "ui/actions";
import hooks from "ui/hooks";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { subscriptionEndsIn } from "ui/utils/workspace";
import { TrialEnd } from "../shared/TrialEnd";

function TeamTrialEnd({ currentWorkspaceId, setModal }: PropsFromRedux) {
  const { workspaces, loading } = hooks.useGetNonPendingWorkspaces();
  const { members } = hooks.useGetWorkspaceMembers(currentWorkspaceId!);
  const history = useHistory();
  const { userId: localUserId } = hooks.useGetUserId();

  // There's no workspace ID if they are in their personal library.
  if (loading || !currentWorkspaceId) {
    return null;
  }

  const workspace = workspaces.find(w => w.id === currentWorkspaceId);

  if (!workspace?.subscription?.trialEnds) {
    return null;
  }

  const roles = members?.find(m => m.userId === localUserId)?.roles;
  const isAdmin = roles?.includes("admin") || false;
  const onClick = isAdmin
    ? () => {
        if (isAdmin) {
          history.push(`/team/${currentWorkspaceId}/settings/billing`);
          setModal("workspace-settings");
        }
      }
    : undefined;

  const expiresIn = subscriptionEndsIn(workspace);

  return (
    <TrialEnd
      expiresIn={expiresIn}
      color="yellow"
      className="py-2 cursor-pointer"
      onClick={onClick}
    />
  );
}

const connector = connect(
  (state: UIState) => ({
    currentWorkspaceId: selectors.getWorkspaceId(state),
  }),
  { setModal: actions.setModal }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(TeamTrialEnd);
