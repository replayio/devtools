import React from "react";
import { WebAuth } from "auth0-js";
import { useRouter } from "next/router";
import { useEffect } from "react";
import useAuth0 from "ui/utils/useAuth0";
import { LoadingScreen } from "ui/components/shared/BlankScreen";

export default function Connection() {
  const auth0 = useAuth0();
  const router = useRouter();
  const q = router.query;
  const connection = Array.isArray(q.connection) ? q.connection[0] : q.connection;

  useEffect(() => {
    if (!connection || auth0.isAuthenticated) {
      router.replace("/");
      return;
    }

    auth0.loginWithRedirect({ connection });
  }, []);

  return <LoadingScreen />;
}
