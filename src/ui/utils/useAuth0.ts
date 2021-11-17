import { useAuth0 as useOrigAuth0, Auth0ContextInterface } from "@auth0/auth0-react";
import { useGetUserInfo } from "ui/hooks/users";
import { isTest, isMock } from "./environment";
import useToken from "./useToken";

const TEST_AUTH = {
  isLoading: false,
  isAuthenticated: true,
  user: {
    sub: "auth0|60351bdaa6afe80068af126e",
    name: "e2e-testing@replay.io",
    email: "e2e-testing@replay.io",
    picture:
      "https://s.gravatar.com/avatar/579464588a2bb4fb0bc1bae7d2df22ae?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fe2.png",
  },
  loginWithRedirect: () => {},
  logout: () => {},
};

export type AuthContext = Auth0ContextInterface | typeof TEST_AUTH;

/**
 * A wrapper around useAuth0() that returns dummy data in tests
 */
export default function useAuth0() {
  const auth = useOrigAuth0();
  const { loading, name, email, picture } = useGetUserInfo();
  const { token, apiKey } = useToken();

  if (apiKey && token) {
    return {
      isLoading: loading,
      isAuthenticated: true,
      user: loading
        ? undefined
        : {
            sub: "api-key",
            name,
            email,
            picture,
          },
      loginWithRedirect: () => {},
      logout: () => {},
    };
  }

  if (isTest() || isMock()) {
    return TEST_AUTH;
  }

  return auth;
}
