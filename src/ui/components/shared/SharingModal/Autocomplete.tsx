import React from "react";
import hooks from "ui/hooks";
import { CollaboratorDbData } from "./CollaboratorsList";
import { Recording } from "ui/types";

function AutocompleteAction({ recording, email }: { recording: Recording; email: string }) {
  const { addNewCollaborator } = hooks.useAddNewCollaborator();

  const onClick = () => {
    addNewCollaborator({
      variables: { recordingId: recording.id, email },
    });
  };

  return <button className="action-add" onClick={onClick}>{`Add`}</button>;
}

interface AutocompleteProps {
  inputValue: string;
  recording: Recording;
  collaborators: CollaboratorDbData[];
}

export default function Autocomplete({ inputValue, collaborators, recording }: AutocompleteProps) {
  return (
    <div className="autocomplete">
      <div className="content">{`${inputValue}`}</div>
      <AutocompleteAction recording={recording} email={inputValue} />
    </div>
  );
}
