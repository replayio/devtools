import React from "react";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import EmailForm from "./EmailForm";
import CollaboratorsList from "./CollaboratorsList";
import "./PrivateSettings.css";

type PrivateSettingsProps = PropsFromRedux & {};

function PrivateSettings({ recordingId }: PrivateSettingsProps) {
  const { collaborators, recording, loading } = hooks.useGetOwnersAndCollaborators(recordingId!);

  if (loading) {
    return null;
  }

  return (
    <section className="private-settings">
      <h1>Collaborators</h1>
      <EmailForm {...{ recording, collaborators }} />
      <CollaboratorsList {...{ recording: recording!, collaborators, recordingId: recordingId! }} />
    </section>
  );
}

const connector = connect((state: UIState) => ({ recordingId: selectors.getRecordingId(state) }));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(PrivateSettings);
