import { RecordingId } from "@replayio/protocol";
import React from "react";

import hooks from "ui/hooks";

import CollaboratorsList from "./CollaboratorsList";
import EmailForm from "./EmailForm";

type CollaboratorsProps = {
  recordingId: RecordingId;
};

export default function Collaborators({ recordingId }: CollaboratorsProps) {
  const { collaborators, owner, loading } = hooks.useGetOwnersAndCollaborators(recordingId!);

  if (loading || !collaborators) {
    return null;
  }

  return (
    <>
      <div className="mt-4 mb-2 font-bold">Add People</div>
      <section className="flex w-full flex-col space-y-4">
        <div className="border border-transparent">
          <EmailForm recordingId={recordingId} />
        </div>
        <CollaboratorsList {...{ owner, collaborators }} />
      </section>
    </>
  );
}
