import { gql, useQuery, useMutation } from "@apollo/client";
import { getUserId } from "ui/utils/useToken";
import { useGetUserInfo } from "./users";

export interface Invitation {
  created_at: string;
  invited_email: string;
  pending: boolean;
  invited_user: InvitedUser;
}

export interface InvitedUser {
  invited: boolean;
}

export function useGetInvitations() {
  const userId = getUserId();
  const { data, loading, error } = useQuery(
    gql`
      query GetInvitations($userId: uuid) {
        invitations(where: { user_id: { _eq: $userId } }) {
          created_at
          invited_email
          pending
          invited_user {
            invited
          }
        }
      }
    `,
    {
      variables: { userId },
    }
  );

  if (error) {
    console.error("Apollo error while fetching invitations:", error);
  }

  const invitations: Invitation[] = data?.invitations;
  return { invitations, loading };
}

export function useAddInvitation() {
  const [addInvitation] = useMutation(
    gql`
      mutation AddInvitation($userId: uuid, $email: String) {
        insert_invitations(objects: { invited_email: $email, user_id: $userId }) {
          affected_rows
        }
      }
    `,
    {
      refetchQueries: ["GetInvitations"],
    }
  );

  return addInvitation;
}

export function useMaybeClaimInvite() {
  const { invitations, invited, email, loading } = useGetUserInfo();
  const claimInvitation = useClaimInvitation();

  if (loading) {
    return { loading };
  }

  // If the user is invited/activated already, bail.
  if (invited) {
    return { loading: false };
  }

  // Claim the existing invitations for that user's email, if they exist. This
  // also updated the user record to be invited/activated.
  if (invitations) {
    claimInvitation({ variables: { email } });
    return { loading: false };
  }

  return { loading: false };
}

export function useClaimInvitation() {
  const [claimInvitation] = useMutation(
    gql`
      mutation ClaimInvitation($email: String) {
        update_invitations(where: { invited_email: { _eq: $email } }, _set: { pending: false }) {
          affected_rows
        }
        update_users(where: { email: { _eq: $email } }, _set: { invited: true }) {
          affected_rows
        }
      }
    `,
    { refetchQueries: ["GetRecording"] }
  );

  return claimInvitation;
}
