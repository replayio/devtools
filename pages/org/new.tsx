import React from "react";

import useAuth0 from "ui/utils/useAuth0";
import Login from "ui/components/shared/Login/Login";
import TeamOnboarding from "ui/components/shared/TeamOnboarding";

export default function NewTeam() {
  const auth0 = useAuth0();

  if (!auth0.isAuthenticated) {
    return <Login returnToPath={window.location.pathname + window.location.search} />;
  }

  return <TeamOnboarding organization={true} />;
}
