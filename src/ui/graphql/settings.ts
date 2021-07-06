import { gql } from "@apollo/client";

export const GET_USER_SETTINGS = gql`
  query GetUserSettings {
    viewer {
      settings {
        showElements
        showReact
        enableTeams
        enableRepaint
      }
      defaultWorkspace {
        id
      }
    }
  }
`;
