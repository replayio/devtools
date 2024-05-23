import { useContext } from "react";

import { useGetTeamRouteParams } from "ui/components/Library/Team/utils";

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
  const { team } = useContext(TeamContext);

  return (
    <>
      <ViewPage defaultView={team?.isTest ? "runs" : "recordings"} />
      <ParamHandler />
    </>
  );
}
