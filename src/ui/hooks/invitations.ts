import { gql, useQuery, useMutation } from "@apollo/client";
import { useGetUserInfo } from "./users";

export interface Invitation {
  createdAt: string;
  invitedEmail: string;
  pending: boolean;
}

export interface InvitedUser {
  invited: boolean;
}

export interface NonRegisteredTeamMember {
  invitedEmail: string;
}

export function useGetInvitations() {
  const { data, loading, error } = useQuery(
    gql`
      query GetInvitations {
        viewer {
          sentInvitations {
            edges {
              node {
                createdAt
                email
              }
            }
          }
        }
      }
    `
  );

  if (error) {
    console.error("Apollo error while fetching invitations:", error);
  }

  let invitations: Invitation[] | undefined = undefined;
  if (data?.viewer) {
    invitations = data.viewer.sentInvitations.edges.map(({ node }: any) => ({
      createdAt: node.createdAt,
      invitedEmail: node.email,
      pending: false,
    }));
  }
  return { invitations, loading };
}

export function useGetAvailableInvitations() {
  const { data, loading, error } = useQuery(
    gql`
      query GetInvitations {
        viewer {
          availableInvitations
        }
      }
    `
  );

  return { availableInvitations: data?.viewer?.availableInvitations, loading, error };
}

export function useAddInvitation() {
  const [addInvitation] = useMutation(
    gql`
      mutation AddInvitation($email: String!) {
        sendUserInvitation(input: { email: $email }) {
          success
        }
      }
    `,
    {
      refetchQueries: ["GetInvitations", "GetNonRegisteredTeamMembers"],
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
