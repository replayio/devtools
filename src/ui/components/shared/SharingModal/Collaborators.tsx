import React from "react";
import hooks from "ui/hooks";
import EmailForm from "./EmailForm";
import CollaboratorsList from "./CollaboratorsList";
import { RecordingId } from "@recordreplay/protocol";

type CollaboratorsProps = {
  recordingId: RecordingId;
};

export default function Collaborators({ recordingId }: CollaboratorsProps) {
  const { collaborators, recording, loading } = hooks.useGetOwnersAndCollaborators(recordingId!);

  if (loading || !collaborators || !recording) {
    return null;
  }

  return (
    <section className="flex flex-col w-full space-y-2">
      <EmailForm recordingId={recordingId} />
      <CollaboratorsList {...{ recording, collaborators }} />
    </section>
  );
}
