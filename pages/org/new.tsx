import React, { FC } from "react";

import useAuth0 from "ui/utils/useAuth0";
import Login from "ui/components/shared/Login/Login";
import TeamOnboarding from "ui/components/shared/TeamOnboarding";

const NewTeam: FC = () => {
  const auth0 = useAuth0();

  if (!auth0.isAuthenticated) {
    return <Login returnToPath={window.location.pathname + window.location.search} />;
  }

  return <TeamOnboarding organization={true} />;
};

export default Newteam;
