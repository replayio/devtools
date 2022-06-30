import { createContext, ReactNode } from "react";
import { Workspace } from "ui/types";
import { useGetWorkspace } from "ui/hooks/workspaces";
import { useGetTeamRouteParams } from "ui/components/Library/Team/utils";
import hooks from "ui/hooks";
import { LibrarySpinner } from "../LibrarySpinner";

export const MY_LIBRARY_TEAM = { name: "Your Library", isTest: false, id: "me" };
type TeamContainerContextType = {
  teamId: string;
  team?: Workspace | typeof MY_LIBRARY_TEAM | null;
  isPendingTeam?: boolean;
};

export const TeamContext = createContext<TeamContainerContextType>(null as any);

export function TeamContextRoot({ children }: { children: ReactNode }) {
  const { teamId } = useGetTeamRouteParams();
  const { workspace } = useGetWorkspace(teamId);
  const { pendingWorkspaces, loading } = hooks.useGetPendingWorkspaces();

  if (loading || !pendingWorkspaces) {
    return <LibrarySpinner />;
  }

  const isPendingTeam = pendingWorkspaces?.some(w => w.id === teamId);

  return (
    <TeamContext.Provider value={{ teamId, team: workspace, isPendingTeam }}>
      {children}
    </TeamContext.Provider>
  );
}

export function MyLibraryContextRoot({ children }: { children: ReactNode }) {
  const { teamId } = useGetTeamRouteParams();

  return (
    <TeamContext.Provider value={{ teamId, team: MY_LIBRARY_TEAM, isPendingTeam: false }}>
      {children}
    </TeamContext.Provider>
  );
}
