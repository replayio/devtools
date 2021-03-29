import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
const Modal = require("ui/components/shared/Modal").default;
import hooks from "ui/hooks";
import useToken from "ui/utils/useToken";
import "./NewWorkspaceModal.css";

const content1 = `Workspaces are another way for you to see other people's replays by default.`;
const content2 = `You can do this by creating a workspace for your company, team or group and adding members. Replays created by members are automatically visible to other members in their workspaces.`;

function NewWorkspaceModal({ hideModal }: PropsFromRedux) {
  const [inputValue, setInputValue] = useState("");
  const createNewWorkspace = hooks.useCreateNewWorkspace();
  const handleSave = () => {
    createNewWorkspace({
      variables: { name: inputValue, userId },
    });
    hideModal();
  };

  const { claims } = useToken();
  const userId = claims?.hasura.userId;

  return (
    <div className="new-workspace-modal">
      <Modal>
        <main>
          <h1>
            <span className="material-icons">add_circle</span>
            <span>New Workspace</span>
          </h1>
          <div className="new-workspace-content">
            <p>{content1}</p>
            <p>{content2}</p>
          </div>
          <input
            type="textarea"
            placeholder="Your new workspace"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
          />
          <div className="actions">
            <button onClick={handleSave}>Save</button>
          </div>
        </main>
      </Modal>
    </div>
  );
}

const connector = connect(null, {
  hideModal: actions.hideModal,
});
export type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(NewWorkspaceModal);
