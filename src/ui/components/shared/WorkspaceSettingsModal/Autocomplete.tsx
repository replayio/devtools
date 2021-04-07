import React, { Dispatch, SetStateAction, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { gql, useQuery } from "@apollo/client";
import { getUserId } from "ui/utils/useToken";
import { actions } from "ui/actions";
import { ModalType, SettingsTabTitle } from "ui/state/app";

function useFetchCollaborateorId(email: string) {
  const { data, loading, error } = useQuery(
    gql`
      query GetCollaboratorId($email: String = "") {
        user_id_by_email(args: { email: $email }) {
          id
        }
      }
    `,
    {
      variables: { email },
    }
  );

  const userId = data?.user_id_by_email[0]?.id;

  return { userId, loading, error };
}

function AutocompleteAction({
  workspaceId,
  email,
  userId,
  setModal,
  setDefaultSettingsTab,
}: {
  workspaceId: string;
  email: string;
  userId: string;
  setModal: (modalType: ModalType) => void;
  setDefaultSettingsTab: (tabTitle: SettingsTabTitle) => void;
}) {
  const { members } = hooks.useGetWorkspaceMembers(workspaceId);
  const memberExists = members?.find(member => member.user.email == email);
  const inviteNewWorkspaceMember = hooks.useInviteNewWorkspaceMember();
  const inviterUserId = getUserId();

  if (memberExists) {
    return <div>{`User already invited`}</div>;
  }

  const handleTeamInvite = () => {
    inviteNewWorkspaceMember({
      variables: { userId, workspaceId, inviterUserId },
    });
  };
  const handleReplayInvite = () => {
    setDefaultSettingsTab("Invitations");
    setModal("settings");
  };

  // If the email doesn't already have an associated Replay account registered to it.
  if (!userId) {
    return (
      <button className="action-invite" onClick={handleReplayInvite}>{`Invite to Replay`}</button>
    );
  }

  return <button className="action-invite" onClick={handleTeamInvite}>{`Invite`}</button>;
}

type AutocompleteProps = PropsFromRedux & { inputValue: string };

function Autocomplete({
  workspaceId,
  inputValue,
  setModal,
  setDefaultSettingsTab,
}: AutocompleteProps) {
  const { userId, loading } = useFetchCollaborateorId(inputValue);

  if (loading) {
    return (
      <div className="autocomplete">
        <div className="content">{`${inputValue}`}</div>
        <div>Loading</div>
      </div>
    );
  }

  return (
    <div className="autocomplete">
      <div className="content">{`${inputValue}`}</div>
      <AutocompleteAction
        email={inputValue}
        workspaceId={workspaceId!}
        userId={userId}
        setModal={setModal}
        setDefaultSettingsTab={setDefaultSettingsTab}
      />
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    workspaceId: selectors.getWorkspaceId(state),
  }),
  { setModal: actions.setModal, setDefaultSettingsTab: actions.setDefaultSettingsTab }
);
export type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Autocomplete);
