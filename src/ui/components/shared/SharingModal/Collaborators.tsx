import { RecordingId } from "@recordreplay/protocol";
import React from "react";
import hooks from "ui/hooks";

import CollaboratorsList from "./CollaboratorsList";
import EmailForm from "./EmailForm";

type CollaboratorsProps = {
  recordingId: RecordingId;
};

export default function Collaborators({ recordingId }: CollaboratorsProps) {
  const { collaborators, recording, loading } = hooks.useGetOwnersAndCollaborators(recordingId!);

  if (loading || !collaborators || !recording) {
    return null;
  }

  return (
    <section className="flex w-full flex-col space-y-4">
      <EmailForm recordingId={recordingId} />
      <CollaboratorsList {...{ collaborators, recording }} />
    </section>
  );
}
