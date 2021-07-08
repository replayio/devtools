import { gql } from "@apollo/client";

export const GET_USER_INFO = gql`
query GetUser {
  viewer {
    user {
      id
    }
    email
    internal
    nags
    acceptedTOSVersion
  }
}
`;
