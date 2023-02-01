import React from "react";

import { Recording, User } from "shared/graphql/types";
import { AvatarImage } from "ui/components/Avatar";
import hooks from "ui/hooks";

import MaterialIcon from "../MaterialIcon";

export interface CollaboratorDbData {
  collaborationId: string;
  user?: User;
  email?: string;
  createdAt: string;
}

function Collaborator({
  collaborator,
  collaborationId,
}: {
  collaborator: CollaboratorDbData;
  collaborationId?: string;
}) {
  const { deleteCollaborator } = hooks.useDeleteCollaborator();
  const handleDeleteClick = () => {
    if (collaborationId) {
      deleteCollaborator({ variables: { collaborationId } });
    }
  };
  let iconAndName;

  if (collaborator.email) {
    iconAndName = (
      <>
        <div
          className="rounded-full bg-themeBase-95"
          style={{ padding: "5px", marginRight: "8px" }}
        >
          <MaterialIcon className="align-middle text-bodyColor" iconSize="xl">
            mail_outline
          </MaterialIcon>
        </div>
        <div className="main">
          <div className="name">{collaborator.email}</div>
        </div>
      </>
    );
  } else {
    iconAndName = (
      <>
        <div className="icon avatar">
          <AvatarImage src={collaborator.user?.picture} />
        </div>
        <div className="main">
          <div className="name">{collaborator.user?.name}</div>
        </div>
      </>
    );
  }

  return (
    <div className="permission">
      {iconAndName}
      <div className="role">Collaborator</div>
      <button className="delete" onClick={handleDeleteClick}>
        <div className="img close" />
      </button>
    </div>
  );
}

function Author({ user }: { user: User | void }) {
  if (!user) {
    return null;
  }

  const { picture, name } = user;
  return (
    <div className="permission">
      <div className="icon avatar">
        <AvatarImage src={picture} />
      </div>
      <div className="main">
        <div className="name">{name}</div>
      </div>
      <div className="role">Author</div>
    </div>
  );
}

function Collaborators({ collaborators }: { collaborators: CollaboratorDbData[] }) {
  const sortedCollaborators = collaborators.sort(
    (a: CollaboratorDbData, b: CollaboratorDbData) => Number(b.createdAt) - Number(a.createdAt)
  );

  return (
    <>
      {sortedCollaborators.map((collaborator, i) => (
        <Collaborator
          collaborator={collaborator}
          collaborationId={collaborator.collaborationId}
          key={i}
        />
      ))}
    </>
  );
}

export default function CollaboratorsList({
  owner,
  collaborators,
}: {
  owner: User;
  collaborators: CollaboratorDbData[] | null;
}) {
  return (
    <div className="permissions-list overflow-auto">
      <Author user={owner} />
      {collaborators ? <Collaborators {...{ collaborators }} /> : null}
    </div>
  );
}
