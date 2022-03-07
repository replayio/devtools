import React from "react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import useAuth0 from "ui/utils/useAuth0";
import LoadingScreen from "ui/components/shared/LoadingScreen";

export default function Connection() {
  const auth0 = useAuth0();
  const router = useRouter();
  const q = router.query;
  const connection = Array.isArray(q.connection) ? q.connection[0] : q.connection;

  useEffect(() => {
    const home = window.location.origin + "/";
    if (!connection || auth0.isAuthenticated) {
      router.replace(home);
      return;
    }

    auth0
      .getAccessTokenSilently({ connection })
      .then(() => {
        // We used to use `redirect_url` but it introduced an odd race
        // condition in which the auth0 client would not find the identity after
        // the redirect but then would after the user refreshed. This works
        // around that but may still need revisited later.
        window.location.href = home;
      })
      .catch(e =>
        auth0.loginWithRedirect({
          connection,
          redirectUri: home,
        })
      );
  }, [auth0, connection, router]);

  return <LoadingScreen />;
}
