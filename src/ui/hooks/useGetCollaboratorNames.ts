import { gql, useQuery } from "@apollo/client";
import { useContext, useMemo } from "react";

import { SessionContext } from "replay-next/src/contexts/SessionContext";
import {
  GetCollaboratorNames,
  GetCollaboratorNamesVariables,
} from "shared/graphql/generated/GetCollaboratorNames";
import { useGetRecordingId } from "ui/hooks/recordings";

export type PartialUser = {
  id: string;
  name: string;
};
export type PartialUsers = PartialUser[];

const EMPTY_ARRAY: PartialUsers = [];

// Returns a unified list of collaborators and workspace members with access to the current recording.
export default function useRecordingUsers(excludeCurrentUser: boolean): PartialUser[] {
  const { currentUserInfo } = useContext(SessionContext);

  const recordingId = useGetRecordingId();
  const queryData = useQuery<GetCollaboratorNames, GetCollaboratorNamesVariables>(QUERY, {
    variables: { recordingId },
  });

  const users = useMemo<PartialUsers>(() => {
    const owner = queryData.data?.recording?.owner;
    const collaboratorEdges = queryData.data?.recording?.collaborators?.edges;
    const workspaceEdges = queryData.data?.recording?.workspace?.members?.edges;

    const partialUsers: Map<string, PartialUser> = new Map();
    const currentUserId = currentUserInfo!.id;

    const addPartialUser = (partialUser: PartialUser) => {
      if (!excludeCurrentUser || partialUser.id !== currentUserId) {
        partialUsers.set(partialUser.id, partialUser);
      }
    };

    if (owner) {
      const { id, name } = owner;
      if (name !== null) {
        addPartialUser({ id, name });
      }
    }

    if (collaboratorEdges) {
      collaboratorEdges.forEach(collaboratorEdge => {
        if (collaboratorEdge.node.__typename === "RecordingUserCollaborator") {
          const { id, name } = collaboratorEdge.node.user;
          if (name !== null) {
            addPartialUser({ id, name });
          }
        }
      });
    }

    workspaceEdges?.forEach(workspaceEdge => {
      if (workspaceEdge.node.__typename === "WorkspaceUserMember") {
        const { id, name } = workspaceEdge.node.user;
        if (name !== null) {
          addPartialUser({ id, name });
        }
      }
    });

    return partialUsers.size > 0
      ? Array.from(partialUsers.values()).sort((a, b) => {
          return a.name.localeCompare(b.name);
        })
      : EMPTY_ARRAY;
  }, [queryData, currentUserInfo, excludeCurrentUser]);

  return users;
}

const QUERY = gql`
  query GetCollaboratorNames($recordingId: UUID!) {
    recording(uuid: $recordingId) {
      id
      uuid
      owner {
        id
        name
      }
      collaborators {
        edges {
          node {
            ... on RecordingUserCollaborator {
              user {
                id
                name
              }
            }
          }
        }
      }
      workspace {
        id
        members {
          edges {
            node {
              ... on WorkspaceUserMember {
                user {
                  id
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`;
