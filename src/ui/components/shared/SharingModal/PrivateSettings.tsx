import React from "react";
import hooks from "ui/hooks";
import EmailForm from "./EmailForm";
import CollaboratorsList from "./CollaboratorsList";
import "./PrivateSettings.css";
import { RecordingId } from "@recordreplay/protocol";

type PrivateSettingsProps = {
  recordingId: RecordingId;
};

export default function PrivateSettings({ recordingId }: PrivateSettingsProps) {
  const { collaborators, recording, loading } = hooks.useGetOwnersAndCollaborators(recordingId!);

  if (loading || !collaborators || !recording) {
    return null;
  }

  return (
    <section className="private-settings">
      <h1>Collaborators</h1>
      <EmailForm recordingId={recordingId} />
      <CollaboratorsList {...{ recording, collaborators, recordingId: recordingId! }} />
    </section>
  );
}
