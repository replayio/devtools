import { gql, useMutation, useQuery } from "@apollo/client";
import { getUserId } from "ui/utils/useToken";
import { Invitation } from "./invitations";

export const GET_USER_ID = gql`
  query GetUserId {
    viewer {
      user {
        id
      }
    }
  }
`;

export function useGetUserId() {
  const { data, loading, error } = useQuery(GET_USER_ID);
  return { userId: data?.viewer?.user.id, loading, error };
}

export type UserInfo = {
  invitations: Invitation[];
  invited: boolean;
  email: string;
  internal: boolean;
  loading: boolean;
  nags: Nag[];
};

export enum Nag {
  FIRST_REPLAY = "first_replay",
}

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
          nags
        }
      }
    `,
    {
      variables: { userId },
      skip: !userId,
    }
  );

  if (error) {
    console.error("Apollo error while fetching user:", error);
  }

  const invited: boolean = data?.users_by_pk.invited;
  const email: string = data?.users_by_pk.email;
  const invitations: Invitation[] = data?.users_by_pk.invitations;
  const internal: boolean = data?.users_by_pk.internal;
  const nags: Nag[] = data?.users_by_pk.nags;

  return { invitations, invited, email, internal, loading, nags };
}

export function useUpdateUserNags() {
  const [updateUserNags, { error }] = useMutation(
    gql`
      mutation UpdateUserNags($newNags: [String!]!) {
        updateUserNags(input: { nags: $newNags }) {
          success
        }
      }
    `,
    { refetchQueries: ["GetUser"] }
  );

  if (error) {
    console.error("Apollo error while updating the user's nags:", error);
  }

  return updateUserNags;
}
