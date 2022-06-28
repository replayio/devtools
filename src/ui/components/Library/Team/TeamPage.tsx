import { createContext, ReactNode, useContext } from "react";
import { useGetWorkspace } from "ui/hooks/workspaces";
import { Workspace } from "ui/types";
import { useGetTeamRouteParams } from "ui/utils/library";
import { ViewPage } from "./View/ViewPage";

type TeamContainerContextType = {
  teamId: string;
  team?: Workspace;
};

export const TeamContext = createContext<TeamContainerContextType>(null as any);

export function TeamContainer({ children }: { children: ReactNode }) {
  const { teamId } = useGetTeamRouteParams();
  const { workspace } = useGetWorkspace(teamId);

  return (
    <TeamContext.Provider value={{ teamId, team: workspace }}>{children}</TeamContext.Provider>
  );
}

export function TeamPage() {
  return (
    <TeamContainer>
      <TeamPageContent />
    </TeamContainer>
  );
}

function TeamPageContent() {
  const { team } = useContext(TeamContext);

  if (!team) {
    return <div>Loading placeholder</div>;
  }

  return <ViewPage defaultView={team?.isTest ? "runs" : "recordings"} />;
}
