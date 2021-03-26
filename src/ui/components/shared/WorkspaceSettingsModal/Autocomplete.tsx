import React, { Dispatch, SetStateAction, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { gql, useQuery } from "@apollo/client";
import { useGetRecording } from "ui/hooks/sessions";

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
}: {
  workspaceId: string;
  email: string;
  userId: string;
}) {
  const { members } = hooks.useGetWorkspaceMembers(workspaceId);
  const memberExists = members?.find(member => member.user.email == email);
  const inviteNewWorkspaceMember = hooks.useInviteNewWorkspaceMember();

  if (!userId) {
    return <div>{`Can't invite`}</div>;
  } else if (memberExists) {
    return <div>{`User already invited`}</div>;
  }

  const handleInvite = () => {
    inviteNewWorkspaceMember({
      variables: { userId, workspaceId },
    });
  };

  return <button className="action-invite" onClick={handleInvite}>{`Invite`}</button>;
}

type AutocompleteProps = PropsFromRedux & { inputValue: string };

function Autocomplete({ workspaceId, inputValue }: AutocompleteProps) {
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
      <AutocompleteAction email={inputValue} workspaceId={workspaceId!} userId={userId} />
    </div>
  );
}

const connector = connect((state: UIState) => ({ workspaceId: selectors.getWorkspaceId(state) }));
export type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Autocomplete);
