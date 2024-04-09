import { useRouter } from "next/router";
import React from "react";

import Login from "ui/components/shared/Login/Login";
import TeamOnboarding from "ui/components/shared/TeamOnboarding";
import useAuth0 from "ui/utils/useAuth0";

export default function NewTeam() {
  const auth0 = useAuth0();
  const router = useRouter();
  const testSuites = !!router.query["test-suites"];

  if (!auth0.isAuthenticated) {
    return <Login returnToPath={window.location.pathname + window.location.search} />;
  }

  return <TeamOnboarding testSuites={testSuites} />;
}
