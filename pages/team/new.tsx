import React from "react";

import useAuth0 from "ui/utils/useAuth0";
import Login from "ui/components/shared/Login/Login";
import TeamLeaderOnboardingModal from "ui/components/shared/OnboardingModal/TeamLeaderOnboardingModal";

export function NewTeam() {
  const auth0 = useAuth0();

  if (!auth0.isAuthenticated) {
    return <Login />;
  }

  return <TeamLeaderOnboardingModal />;
}
