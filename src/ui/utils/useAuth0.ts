import { useAuth0 as useOrigAuth0, Auth0ContextInterface, LogoutOptions } from "@auth0/auth0-react";
import { useGetUserInfo } from "ui/hooks/users";
import { setAccessTokenInBrowserPrefs } from "./browser";
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
  getAccessTokenSilently: () => Promise.resolve(),
};

export type AuthContext = Auth0ContextInterface | typeof TEST_AUTH;

/**
 * A wrapper around useAuth0() that returns dummy data in tests
 */
export default function useAuth0() {
  const auth = useOrigAuth0();
  const { loading, email } = useGetUserInfo();
  const { token, external } = useToken();

  if (external && token) {
    return {
      isLoading: loading,
      isAuthenticated: true,
      user: loading
        ? undefined
        : {
            sub: "external-auth",
            email,
          },
      loginWithRedirect: () => {},
      logout: (options: LogoutOptions) => {
        if (window.__IS_RECORD_REPLAY_RUNTIME__) {
          setAccessTokenInBrowserPrefs(null);
        }
        if (options.returnTo) {
          // Forcing a full page reload in this case to clean up any local state
          window.location.href = options.returnTo;
        }
      },
      getAccessTokenSilently: () => Promise.resolve(),
    };
  }

  if (isTest() || isMock()) {
    return TEST_AUTH;
  }

  return auth;
}
