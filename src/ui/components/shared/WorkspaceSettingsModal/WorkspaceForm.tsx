import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";

export function validateEmail(email: string) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function WorkspaceForm({ workspaceId }: PropsFromRedux) {
  const [inputValue, setInputValue] = useState("");
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inviteNewWorkspaceMember = hooks.useInviteNewWorkspaceMember(() => {});

  const onChange = (e: React.FormEvent<HTMLInputElement>) => {
    const newValue = e.currentTarget.value;

    setInputValue(newValue);
    setIsValidEmail(validateEmail(newValue));
  };
  const handleInvite = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    setInputValue("");
    setIsFocused(false);
    inviteNewWorkspaceMember({ variables: { workspaceId, email: inputValue } });
  };

  return (
    <form className="new-workspace-form">
      <div className="subheader">ADD MEMBER</div>
      <input
        type="textarea"
        placeholder="Search emails here"
        value={inputValue}
        onChange={onChange}
        onSubmit={handleInvite}
        onFocus={() => setTimeout(() => setIsFocused(true), 200)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
      />
      {isValidEmail && isFocused ? (
        <div className="autocomplete bg-white">
          <div className="content">{inputValue}</div>
          <button className="action-invite" onClick={handleInvite}>{`Invite`}</button>
        </div>
      ) : null}
    </form>
  );
}

const connector = connect((state: UIState) => ({
  workspaceId: selectors.getWorkspaceId(state),
}));
export type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(WorkspaceForm);
