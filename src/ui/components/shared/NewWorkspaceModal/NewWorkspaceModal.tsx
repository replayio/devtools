import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
const Modal = require("ui/components/shared/Modal").default;
import hooks from "ui/hooks";
import useToken from "ui/utils/useToken";
import { TextInput } from "../Forms";
import MaterialIcon from "../MaterialIcon";
import "./NewWorkspaceModal.css";

function NewWorkspaceModal({ hideModal }: PropsFromRedux) {
  const [inputValue, setInputValue] = useState("");
  const createNewWorkspace = hooks.useCreateNewWorkspace();
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

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
            <MaterialIcon>group_add</MaterialIcon>
            <span>Name your team</span>
          </h1>         
          <form onSubmit={handleSave} className="flex flex-col space-y-4">
            <TextInput
              placeholder="Your team name"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
            />
            <div className="flex justify-end">
              <input
                className="inline-flex items-center px-4 py-2 border border-transparent text-lg font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                type="submit"
                value="Submit"
              />
            </div>
          </form>
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
