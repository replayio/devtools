import { useContext, useEffect } from "react";

import { useGetTeamRouteParams } from "ui/components/Library/Team/utils";
import { refreshLaunchDarklyContext } from "ui/utils/launchdarkly";

import { ParamHandler } from "./ParamHandlers/ParamHandler";
import {
  MY_LIBRARY_TEAM,
  MyLibraryContextRoot,
  TeamContext,
  TeamContextRoot,
} from "./TeamContextRoot";
import { ViewPage } from "./View/ViewPage";

export function TeamPage() {
  const { teamId } = useGetTeamRouteParams();

  useEffect(() => {
    refreshLaunchDarklyContext(teamId);
  }, [teamId]);

  if (teamId === MY_LIBRARY_TEAM.id) {
    return (
      <MyLibraryContextRoot>
        <TeamContent />
      </MyLibraryContextRoot>
    );
  }

  return (
    <TeamContextRoot>
      <TeamContent />
    </TeamContextRoot>
  );
}

function TeamContent() {
  const { team, isPendingTeam } = useContext(TeamContext);

  return (
    <>
      <ViewPage defaultView={team?.isTest && !isPendingTeam ? "runs" : "recordings"} />
      <ParamHandler />
    </>
  );
}
