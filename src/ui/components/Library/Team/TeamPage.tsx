import { useContext } from "react";

import { useGetTeamRouteParams } from "ui/utils/library";
import { ParamHandler } from "./ParamHandlers/ParamHandler";
import { TeamContext, MY_LIBRARY_TEAM, TeamContextRoot, MyLibraryContainer } from "./TeamContext";
import { ViewPage } from "./View/ViewPage";

export function TeamPage() {
  const { teamId } = useGetTeamRouteParams();

  if (teamId === MY_LIBRARY_TEAM.id) {
    return (
      <MyLibraryContainer>
        <TeamContent />
      </MyLibraryContainer>
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
