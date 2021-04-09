import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
const Modal = require("ui/components/shared/Modal").default;
import hooks from "ui/hooks";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import WorkspaceForm from "./WorkspaceForm";
import WorkspaceMember, { NonRegisteredWorkspaceMember } from "./WorkspaceMember";
import "./WorkspaceSettingsModal.css";

const content1 = `Manage members here so that everyone who belongs to this team can see each other's replays.`;

function WorkspaceSettingsModal({ workspaceId }: PropsFromRedux) {
  const { members, loading: registeredMembersLoading } = hooks.useGetWorkspaceMembers(workspaceId!);
  const {
    nonRegisteredTeamMembers,
    loading: nonRegisteredMembersLoading,
  } = hooks.useGetNonRegisteredTeamMembers(workspaceId!);

  return (
    <div className="workspace-settings-modal">
      <Modal>
        <main>
          <h1>
            <span className="material-icons">settings</span>
            <span>Team Settings</span>
          </h1>
          <div className="new-workspace-content">
            <p>{content1}</p>
          </div>
          <WorkspaceForm />
          <div className="workspace-members-container">
            <div className="subheader">MEMBERS</div>
            <ul className="workspace-members">
              {members &&
                !registeredMembersLoading &&
                members.map((member, i) => (
                  <WorkspaceMember member={member} key={`registered-${member.user.email}`} />
                ))}
              {nonRegisteredTeamMembers &&
                !nonRegisteredMembersLoading &&
                nonRegisteredTeamMembers.map((member, i) => (
                  <NonRegisteredWorkspaceMember
                    member={member}
                    key={`non-registered-${member.invited_email}`}
                  />
                ))}
            </ul>
          </div>
        </main>
      </Modal>
    </div>
  );
}

const connector = connect((state: UIState) => ({ workspaceId: selectors.getWorkspaceId(state) }), {
  hideModal: actions.hideModal,
});
export type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(WorkspaceSettingsModal);
