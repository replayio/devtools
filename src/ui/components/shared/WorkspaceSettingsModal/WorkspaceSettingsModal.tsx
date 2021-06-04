import React from "react";
import { connect, ConnectedProps } from "react-redux";
import * as actions from "ui/actions/app";
const Modal = require("ui/components/shared/Modal").default;
import hooks from "ui/hooks";
import * as selectors from "ui/reducers/app";
import { UIState } from "ui/state";
import MaterialIcon from "../MaterialIcon";
import WorkspaceForm from "./WorkspaceForm";
import WorkspaceMember, { NonRegisteredWorkspaceMember } from "./WorkspaceMember";
import "./WorkspaceSettingsModal.css";

const content1 = `Manage members here so that everyone who belongs to this team can see each other's replays.`;

function WorkspaceSettingsModal({ workspaceId }: PropsFromRedux) {
  const { members, loading } = hooks.useGetWorkspaceMembers(workspaceId!);

  return (
    <div className="workspace-settings-modal">
      <Modal>
        <main>
          <h1>
            <MaterialIcon>settings</MaterialIcon>
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
                !loading &&
                members.map(member =>
                  member.email ? (
                    <NonRegisteredWorkspaceMember
                      member={member}
                      key={`non-registered-${member.email}`}
                    />
                  ) : (
                    <WorkspaceMember member={member} key={`registered-${member.userId}`} />
                  )
                )}
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
