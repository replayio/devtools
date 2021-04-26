import React, { useState } from "react";
import { Recording, User } from "ui/types";
import hooks from "ui/hooks";
import "./CollaboratorsList.css";

export interface CollaboratorDbData {
  collaborationId: string;
  user: User;
}

type Role = "owner" | "collaborator";

function Permission({
  user,
  role,
  collaborationId,
}: {
  user: User;
  role: Role;
  collaborationId?: string;
}) {
  const { deleteCollaborator } = hooks.useDeleteCollaborator();

  const handleDeleteClick = () => {
    deleteCollaborator({ variables: { collaborationId } });
  };

  return (
    <div className="permission">
      <div className="icon" style={{ backgroundImage: `url(${user.picture})` }} />
      <div className="main">
        <div className="name">{user.name}</div>
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
  recording: Recording;
  collaborators: CollaboratorDbData[] | null;
  recordingId: string;
}) {
  return (
    <div className="permissions-list">
      <Permission user={recording.user!} role={"owner"} />
      {collaborators
        ? collaborators.map((collaborator, i) => (
            <Permission
              user={collaborator.user}
              role={"collaborator"}
              key={i}
              collaborationId={collaborator.collaborationId}
            />
          ))
        : null}
    </div>
  );
}
