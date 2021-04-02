import { gql, useQuery } from "@apollo/client";
import { getUserId } from "ui/utils/useToken";
import { Invitation } from "./invitations";

export function useGetUserInfo() {
  const userId = getUserId();
  const { data, loading, error } = useQuery(
    gql`
      query GetUser($userId: uuid!) {
        users_by_pk(id: $userId) {
          invited
          email
          invitations {
            pending
          }
          internal
        }
      }
    `,
    {
      variables: { userId },
    }
  );

  if (error) {
    console.error("Apollo error while fetching user:", error);
  }

  const invited: boolean = data?.users_by_pk.invited;
  const email: string = data?.users_by_pk.email;
  const invitations: Invitation[] = data?.users_by_pk.invitations;
  const isInternal: boolean = data?.users_by_pk.internal;

  return { invitations, invited, email, isInternal, loading };
}
