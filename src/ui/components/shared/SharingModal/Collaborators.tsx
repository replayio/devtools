import { RecordingId } from "@replayio/protocol";
import React from "react";
import hooks from "ui/hooks";
import EmailForm from "./EmailForm";
import CollaboratorsList from "./CollaboratorsList";

type CollaboratorsProps = {
  recordingId: RecordingId;
};

export default function Collaborators({ recordingId }: CollaboratorsProps) {
  const { collaborators, owner, loading } = hooks.useGetOwnersAndCollaborators(recordingId!);

  if (loading || !collaborators || !owner) {
    return null;
  }

  return (
    <section className="flex w-full flex-col space-y-4">
      <EmailForm recordingId={recordingId} />
      <CollaboratorsList {...{ owner, collaborators }} />
    </section>
  );
}
