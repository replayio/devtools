import classNames from "classnames";
import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import { PendingWorkspaceInvitation } from "ui/types";
import { isTeamMemberInvite, removeUrlParameters } from "ui/utils/environment";
import BlankScreen from "../BlankScreen";
import Modal, { ModalContent } from "../NewModal";
import Spinner from "../Spinner";

type Status = "pending" | "loading" | "loaded" | "declined";
type Actions = "accept" | "decline";

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

  return (
    <TeamMemberOnboardingModal {...{ hideModal, setWorkspaceId, workspaces: pendingWorkspaces }} />
  );
}

function TeamMemberInvitation({
  workspace,
  onGo,
  onAction,
}: {
  workspace: PendingWorkspaceInvitation;
  onAction: (action: Actions) => void;
  onGo: (id: string) => void;
  hideModal: () => void;
}) {
  const [status, setState] = useState<Status>("pending");
  // Keep the workspace info (id, name) here so that we can reference it even after the
  // user accepts the invitation. Otherwise, it disappears from the query.
  const [workspaceTarget] = useState(workspace);
  const rejectPendingInvitation = hooks.useRejectPendingInvitation(() => {
    onAction("decline");
  });
  const acceptPendingInvitation = hooks.useAcceptPendingInvitation(() => {
    onAction("accept");
    setState("loaded");
  });

  const onAccept = () => {
    setState("loading");
    acceptPendingInvitation({ variables: { workspaceId: workspaceTarget.id } });
  };
  const onDecline = () => {
    setState("declined");
    rejectPendingInvitation({ variables: { workspaceId: workspace.id } });
  };

  let callToAction;

  if (status == "declined") {
    callToAction = <div className="select-none">Declined</div>;
  } else if (status == "pending") {
    callToAction = (
      <div className="space-y-2 flex flex-col items-center">
        <div className="space-x-4 flex flex-row">
          <button
            onClick={onAccept}
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent font-medium rounded-md text-white bg-primaryAccent hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent"
          >
            Accept
          </button>
          {!isTeamMemberInvite() ? (
            <button
              onClick={onDecline}
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent font-medium rounded-md bg-gray-200 hover:bg-gray-300"
            >
              Decline
            </button>
          ) : null}
        </div>
      </div>
    );
  } else if (status == "loading") {
    callToAction = (
      <div className="space-y-2 flex flex-col items-center">
        <button
          disabled
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent font-medium rounded-md text-white bg-primaryAccent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent"
        >
          <Spinner className="animate-spin h-6 w-6 text-white" />
        </button>
      </div>
    );
  } else {
    callToAction = (
      <div className="space-y-2 flex flex-col items-center">
        <button
          onClick={() => onGo(workspaceTarget.id)}
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent font-medium rounded-md text-white bg-primaryAccent hover:bg-primaryAccentHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent"
        >
          {`Open`}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center justify-between space-x-8">
      <div className="flex flex-col text-gray-500 overflow-hidden">
        <h2 className="text-2xl font-semibold  whitespace-pre overflow-ellipsis overflow-hidden">{`${workspaceTarget.name} team`}</h2>
        <div className="overflow-hidden whitespace-pre overflow-ellipsis">{`${workspaceTarget.recordingCount} replays`}</div>
        <div className="overflow-hidden whitespace-pre overflow-ellipsis">
          {workspaceTarget.inviterEmail
            ? `Invited by ${workspaceTarget.inviterEmail}`
            : `Invited through invite link`}
        </div>
      </div>
      {callToAction}
    </div>
  );
}

type TeamMemberOnboardingModalProps = PropsFromRedux & {
  workspaces: PendingWorkspaceInvitation[];
};

function TeamMemberOnboardingModal({
  hideModal,
  setWorkspaceId,
  workspaces,
}: TeamMemberOnboardingModalProps) {
  const [displayedWorkspaces] = useState(workspaces);
  const [actions, setActions] = useState<Actions[]>([]);
  const userInfo = hooks.useGetUserInfo();
  const updateUserNags = hooks.useUpdateUserNags();
  const updateDefaultWorkspace = hooks.useUpdateDefaultWorkspace();
  const isFinished = actions.length === displayedWorkspaces.length;

  const onAction = (action: Actions) => setActions([...actions, action]);
  const onSkip = () => {
    // We should show a confirm prompt if a user still has invitation actions to do,
    // or they're trying to skip when they accepted an invitation and should be
    // nudged to open that team.
    if (isFinished && !actions.includes("accept")) {
      removeUrlParameters();
      hideModal();
      return;
    }

    if (window.confirm(`Are you sure you want to skip this step?`)) {
      removeUrlParameters();
      hideModal();
    }
  };
  const onGo = (workspaceId: string) => {
    const line1 = `You still have remaining invitations.`;
    const line2 = `Are you sure you want to proceed?`;

    if (isFinished || window.confirm(`${line1}\n\n${line2}`)) {
      if (!userInfo.nags.includes(Nag.FIRST_REPLAY)) {
        // Skip showing the user the first replay nag, since they will be going straight to a team.
        const newNags = [...userInfo.nags, Nag.FIRST_REPLAY];
        updateUserNags({
          variables: { newNags },
        });
      }

      setWorkspaceId(workspaceId);
      updateDefaultWorkspace({ variables: { workspaceId } });
      hideModal();

      // Remove any URL parameters. This applies when a user clicks on a team invite
      // link from their email.
      removeUrlParameters();

      return;
    }
  };

  const headerText =
    displayedWorkspaces.length == 1
      ? `You have a new team invitation`
      : `You have new team invitations`;

  return (
    <>
      {isTeamMemberInvite() ? <BlankScreen className="fixed" /> : null}
      <Modal
        onMaskClick={onSkip}
        options={{ maskTransparency: isTeamMemberInvite() ? "transparent" : "translucent" }}
      >
        <ModalContent>
          <div className="space-y-8 flex flex-col">
            <h2 className="font-bold text-3xl ">{headerText}</h2>
            {displayedWorkspaces.map(workspace => (
              <TeamMemberInvitation
                {...{ hideModal, onGo, workspace, onAction }}
                key={workspace.id}
              />
            ))}
            {isFinished && !actions.includes("accept") ? (
              <button
                className={classNames(
                  "py-2 font-medium rounded-md bg-primaryAccent hover:bg-primaryAccentHover text-white"
                )}
                onClick={onSkip}
              >
                Done
              </button>
            ) : null}
          </div>
        </ModalContent>
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
