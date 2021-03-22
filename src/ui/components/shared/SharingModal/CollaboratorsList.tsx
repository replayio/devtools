import React, { useState } from "react";
import hooks from "ui/hooks";
import { Role, RecordingDbData, CollaboratorDbData, User } from "./types";

function Permission({ user, role, recordingId }: { user: User; role: Role; recordingId: string }) {
  const { deleteCollaborator, error } = hooks.useDeleteCollaborator();

  const handleDeleteClick = () => {
    deleteCollaborator({ variables: { recordingId, userId: user.id } });
  };
  const [showErrorMessage, setShowErrorMessage] = useState(false);

  if (error) {
    setTimeout(() => setShowErrorMessage(false), 2000);
    return <div className="permission">Could not delete this collaborator</div>;
  }

  return (
    <div className="permission">
      <div className="icon" style={{ backgroundImage: `url(${user.picture})` }} />
      <div className="main">
        <div className="name">{user.name}</div>
        <div className="email">{user.email}</div>
      </div>
      <div className="role">{role}</div>
      {role === "collaborator" ? (
        <button className="delete" onClick={handleDeleteClick}>
          <div className="img close" />
        </button>
      ) : null}
    </div>
  );
}

export default function CollaboratorsList({
  recording,
  collaborators,
  recordingId,
}: {
  recording: RecordingDbData;
  collaborators: CollaboratorDbData[];
  recordingId: string;
}) {
  const owner = recording.user;

  return (
    <div className="permissions-list">
      <Permission user={owner} role={"owner"} recordingId={recordingId} />
      {collaborators
        ? collaborators.map((collaborator, i) => (
            <Permission
              user={collaborator.user}
              role={"collaborator"}
              key={i}
              recordingId={recordingId}
            />
          ))
        : null}
    </div>
  );
}
