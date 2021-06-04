import { gql, useQuery, useMutation } from "@apollo/client";

export interface Invitation {
  createdAt: string;
  invitedEmail: string;
  pending: boolean;
}

export interface InvitedUser {
  invited: boolean;
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
