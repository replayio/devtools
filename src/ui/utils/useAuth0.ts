import { Auth0ContextInterface, LogoutOptions, useAuth0 as useOrigAuth0 } from "@auth0/auth0-react";
import { useRouter } from "next/router";

import { isTest } from "shared/utils/environment";
import { useGetUserInfo } from "ui/hooks/users";

import { setAccessTokenInBrowserPrefs } from "./browser";
import useToken from "./useToken";

export type AuthContext = Auth0ContextInterface | typeof TEST_AUTH;

const TEST_AUTH = {
  error: undefined,
  isLoading: false,
  isAuthenticated: true,
  connection: "TEST",
  user: {
    sub: "auth0|60351bdaa6afe80068af126e",
    name: "e2e-testing@replay.io",
    email: "e2e-testing@replay.io",
    picture:
      "https://s.gravatar.com/avatar/579464588a2bb4fb0bc1bae7d2df22ae?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fe2.png",
  },
  loginAndReturn: () => {},
  loginWithRedirect: () => {},
  logout: () => {},
  getAccessTokenSilently: () => Promise.resolve(),
};

// TODO [hbenl, ryanjduffy] This function should `useMemo` to memoize the "user" object it returns.
// As it is, this hooks prevents components like CommentTool from limiting how often their effects run.
export default function useAuth0() {
  const router = useRouter();
  const auth = useOrigAuth0();
  const { loading, email } = useGetUserInfo();
  const { token, external } = useToken();

  const loginAndReturn = () => {
    router.push({
      pathname: "/login",
      query: {
        returnTo: window.location.pathname + window.location.search,
      },
    });
  };

  if (external && token) {
    return {
      error: undefined,
      isLoading: loading,
      isAuthenticated: true,
      connection: "EXTERNAL",
      user: loading
        ? undefined
        : {
            sub: "external-auth",
            email,
          },
      loginAndReturn,
      loginWithRedirect: auth.loginWithRedirect,
      logout: (options?: LogoutOptions) => {
        if (window.__IS_RECORD_REPLAY_RUNTIME__) {
          setAccessTokenInBrowserPrefs(null);
        }
        auth.logout(options);
      },
      getAccessTokenSilently: () => Promise.resolve(),
    };
  }

  if (isTest()) {
    return TEST_AUTH;
  }

  // for social logins, the connection (e.g. google-oauth2) is the prefix. For
  // SAML logins, the connection is the client-specific code after the samlp
  // prefix (samlp|client-name|user-id).
  let connection: string | undefined;
  if (auth.user) {
    const parts = auth.user.sub.split("|") ?? [];
    connection = parts[0] === "samlp" ? parts[1] : parts[0];
  }

  return { ...auth, connection, loginAndReturn };
}
