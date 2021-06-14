import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import BlankScreen from "../BlankScreen";
import Modal from "../NewModal";
import Spinner from "../Spinner";
const { prefs } = require("ui/utils/prefs");

type Status = "pending" | "loading" | "loaded";

function TeamMemberOnboardingModalLoader({ hideModal, setWorkspaceId }: PropsFromRedux) {
  const { pendingWorkspaces, loading } = hooks.useGetPendingWorkspaces();

  if (loading || !pendingWorkspaces) {
    return (
      <Modal options={{ maskTransparency: "translucent" }}>
        <div className="p-12 bg-white rounded-lg shadow-xl text-xl relative flex">
          <Spinner className="animate-spin h-6 w-6 text-gray-500" />
        </div>
      </Modal>
    );
  }

  const workspace = pendingWorkspaces[0];

  return <TeamMemberOnboardingModal {...{ hideModal, setWorkspaceId, workspace }} />;
}

type TeamMemberOnboardingModalProps = PropsFromRedux & {
  workspace: { id: string; name: string };
};

function TeamMemberOnboardingModal({
  hideModal,
  setWorkspaceId,
  workspace,
}: TeamMemberOnboardingModalProps) {
  const [status, setState] = useState<Status>("pending");
  const userInfo = hooks.useGetUserInfo();
  const updateUserNags = hooks.useUpdateUserNags();
  const updateDefaultWorkspace = hooks.useUpdateDefaultWorkspace();
  // Keep the workspace info (id, name) here so that we can reference it even after the
  // user accepts the invitation. Otherwise, it disappears from the query.
  const [workspaceTarget] = useState(workspace);
  const acceptPendingInvitation = hooks.useAcceptPendingInvitation(() => setState("loaded"));

  const onSkip = () => {
    if (window.confirm(`Are you sure you want to skip this step?`)) {
      window.history.pushState({}, document.title, window.location.pathname);
      hideModal();
    }
  };
  const onAccept = () => {
    setState("loading");
    acceptPendingInvitation({ variables: { workspaceId: workspaceTarget.id } });
  };
  const onGo = () => {
    // Skip showing the user the first replay nag, since they will be going straight to a team.
    const newNags = [...userInfo.nags, Nag.FIRST_REPLAY];
    updateUserNags({
      variables: { newNags },
    });

    setWorkspaceId(workspaceTarget.id);
    updateDefaultWorkspace({ variables: { workspaceId: workspaceTarget.id } });

    setTimeout(
      () => (window.location.href = window.location.origin + window.location.pathname),
      1000
    );
  };

  let callToAction;

  if (status == "pending") {
    callToAction = (
      <div className="space-y-2 flex flex-col items-center">
        <button
          onClick={onAccept}
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent font-medium rounded-md shadow-sm text-white bg-primaryAccent hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Accept the invitation
        </button>
        <button className="text-gray-400 text-base underline" onClick={onSkip}>
          Skip this step
        </button>
      </div>
    );
  } else if (status == "loading") {
    callToAction = (
      <div className="space-y-2 flex flex-col items-center">
        <button
          disabled
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent font-medium rounded-md shadow-sm text-white bg-primaryAccent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Spinner className="animate-spin h-6 w-6 text-white" />
        </button>
      </div>
    );
  } else {
    callToAction = (
      <div className="space-y-2 flex flex-col items-center">
        <button
          onClick={onGo}
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent font-medium rounded-md shadow-sm text-white bg-primaryAccent hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {`Bring me to ${workspaceTarget.name}`}
        </button>
      </div>
    );
  }

  return (
    <>
      <BlankScreen className="fixed" />
      <Modal options={{ maskTransparency: "transparent" }}>
        <div
          className="p-12 bg-white rounded-lg shadow-xl text-xl space-y-8 relative flex flex-col justify-between"
          style={{ width: "520px" }}
        >
          <div className="space-y-8 flex flex-col items-center">
            <h2 className="font-bold text-3xl text-gray-900">{`You're invited to join the ${workspaceTarget.name} team`}</h2>
            {callToAction}
          </div>
        </div>
      </Modal>
    </>
  );
}

const connector = connect(() => ({}), {
  hideModal: actions.hideModal,
  setWorkspaceId: actions.setWorkspaceId,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(TeamMemberOnboardingModalLoader);
