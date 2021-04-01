import React, { Dispatch, SetStateAction, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { gql, useQuery } from "@apollo/client";
import { CollaboratorDbData } from "./CollaboratorsList";
import { Recording, User } from "ui/types";

function getMemberExists(author: User, collaborators: CollaboratorDbData[], userId: string) {
  const isAuthor = author.id == userId;
  const isCollaborator = collaborators.find(({ user_id }) => user_id == userId);

  return isAuthor || isCollaborator;
}

function AutocompleteAction({
  userId,
  recordingId,
  collaborators,
  recording,
}: {
  userId: string;
  recordingId: string;
  collaborators: CollaboratorDbData[];
  recording: Recording;
}) {
  const memberExists = getMemberExists(recording.user!, collaborators, userId);

  const { addNewCollaborator } = hooks.useAddNewCollaborator();

  if (!userId) {
    return <div>{`Can't add`}</div>;
  } else if (memberExists) {
    return <div>{`User already added`}</div>;
  }

  const onClick = () => {
    addNewCollaborator({
      variables: { objects: [{ recording_id: recordingId, user_id: userId }] },
    });
  };

  return <button className="action-add" onClick={onClick}>{`Add`}</button>;
}

type AutocompleteProps = PropsFromRedux & {
  inputValue: string;
  recording: Recording;
  collaborators: CollaboratorDbData[];
};

function Autocomplete({ inputValue, recordingId, collaborators, recording }: AutocompleteProps) {
  const { userId, loading } = hooks.useFetchCollaboratorId(inputValue);

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
        collaborators={collaborators}
        recording={recording}
        recordingId={recordingId!}
        userId={userId}
      />
    </div>
  );
}

const connector = connect((state: UIState) => ({ recordingId: selectors.getRecordingId(state) }));
export type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Autocomplete);
