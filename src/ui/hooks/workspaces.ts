import { useState } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { Workspace, WorkspaceUser } from "ui/types";
import { getUserId } from "ui/utils/useToken";

export function useInitializePersonalWorkspace() {
  const userId = getUserId();
  const initializeRecordings = useInitializeRecordingsToPersonalWorkspace();

  const onCompleted = (data: any) => {
    const personalWorkspaceId = data.insert_workspaces.returning[0].id;
    initializeRecordings({ variables: { workspaceId: personalWorkspaceId, userId } });
  };
  const [initializePersonalWorkspace] = useMutation(
    gql`
      mutation InitializePersonalWorkspace($userId: uuid) {
        insert_workspaces(
          objects: {
            is_personal: true
            name: "Personal"
            workspaces_users: { data: { pending: false, user_id: $userId } }
          }
        ) {
          affected_rows
          returning {
            id
          }
        }
      }
    `,
    {
      refetchQueries: ["GetNonPendingWorkspaces", "GetPersonalWorkspace"],
      variables: { userId },
      onCompleted,
    }
  );

  return initializePersonalWorkspace;
}

export function useInitializeRecordingsToPersonalWorkspace() {
  const [initializeRecordingsToPersonalWorkspace] = useMutation(
    gql`
      mutation InitializePersonalWorkspace($userId: uuid, $workspaceId: uuid) {
        update_recordings(
          where: { user_id: { _eq: $userId }, workspace_id: { _is_null: true } }
          _set: { workspace_id: $workspaceId }
        ) {
          returning {
            id
          }
        }
      }
    `,
    {
      refetchQueries: ["GetWorkspaceRecordings"],
    }
  );

  return initializeRecordingsToPersonalWorkspace;
}

export function useCreateNewWorkspace() {
  const [createNewWorkspace, { error }] = useMutation(
    gql`
      mutation CreateNewWorkspace($userId: uuid, $name: String) {
        insert_workspaces(
          objects: { name: $name, workspaces_users: { data: { user_id: $userId, pending: false } } }
        ) {
          affected_rows
        }
      }
    `,
    {
      refetchQueries: ["GetNonPendingWorkspaces"],
    }
  );

  if (error) {
    console.error("Apollo error while creating a new workspace:", error);
  }

  return createNewWorkspace;
}

export function useGetPendingWorkspaces() {
  const userId = getUserId();
  const { data, loading, error } = useQuery(
    gql`
      query GetPendingWorkspaces($userId: uuid) {
        workspaces(
          where: { workspaces_users: { user_id: { _eq: $userId }, pending: { _eq: true } } }
        ) {
          id
          name
        }
      }
    `,
    {
      variables: { userId },
      pollInterval: 5000,
    }
  );

  if (error) {
    console.error("Apollo error while fetching pending workspace invitations:", error);
  }

  const pendingWorkspaces: Workspace[] = data?.workspaces;
  return { pendingWorkspaces, loading };
}

export function useGetNonPendingWorkspaces(): { workspaces: Workspace[]; loading: boolean } {
  const userId = getUserId();
  const { data, loading, error } = useQuery(
    gql`
      query GetNonPendingWorkspaces($userId: uuid) {
        workspaces(
          where: { workspaces_users: { user_id: { _eq: $userId }, pending: { _eq: false } } }
        ) {
          name
          id
          is_personal
          workspaces_users {
            pending
          }
        }
      }
    `,
    {
      variables: { userId },
      pollInterval: 5000,
    }
  );

  if (error) {
    console.error("Apollo error while creating a new workspace:", error);
  }

  const workspaces: Workspace[] = data?.workspaces || [];
  return { workspaces, loading };
}

export function useGetPersonalWorkspace() {
  const [mutationSent, setMutationSent] = useState(false);
  const initializePersonalWorkspace = useInitializePersonalWorkspace();
  const userId = getUserId();

  const { data, loading, error } = useQuery(
    gql`
      query GetPersonalWorkspace($userId: uuid) {
        workspaces(
          where: { workspaces_users: { user_id: { _eq: $userId } }, is_personal: { _eq: true } }
        ) {
          name
          id
          is_personal
          workspaces_users {
            pending
          }
        }
      }
    `,
    {
      variables: { userId },
    }
  );

  if (error) {
    console.error("Apollo error while getting personal workspace:", error);
  }

  if (loading) {
    const ret: { personalWorkspaceId: null; loading: true } = {
      personalWorkspaceId: null,
      loading: true,
    };
    return ret;
  }

  const workspaces: Workspace[] = data.workspaces;
  const isInitialized = workspaces.length > 0;

  // Be careful here! Getting this wrong will lead to creating multiple personal workspaces
  // for a user.
  if (!isInitialized && !mutationSent) {
    setMutationSent(true);
    initializePersonalWorkspace();
  }

  const ret = { personalWorkspaceId: workspaces[0]?.id, loading: loading || !isInitialized };
  return ret;
}
