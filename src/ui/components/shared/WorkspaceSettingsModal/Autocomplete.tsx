import React from "react";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";

function AutocompleteAction({ workspaceId, email }: { workspaceId: string; email: string }) {
  const inviteNewWorkspaceMember = hooks.useInviteNewWorkspaceMember();

  const handleInvite = () => {
    inviteNewWorkspaceMember({ variables: { workspaceId, email } });
  };

  return <button className="action-invite" onClick={handleInvite}>{`Invite`}</button>;
}

type AutocompleteProps = PropsFromRedux & { inputValue: string };

function Autocomplete({ workspaceId, inputValue }: AutocompleteProps) {
  return (
    <div className="autocomplete">
      <div className="content">{`${inputValue}`}</div>
      <AutocompleteAction email={inputValue} workspaceId={workspaceId!} />
    </div>
  );
}

const connector = connect((state: UIState) => ({
  workspaceId: selectors.getWorkspaceId(state),
}));
export type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Autocomplete);
