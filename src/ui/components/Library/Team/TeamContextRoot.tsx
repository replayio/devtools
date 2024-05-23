import { ReactNode, createContext } from "react";

import { Workspace } from "shared/graphql/types";
import { hasApiKey } from "shared/utils/environment";
import { useGetTeamRouteParams } from "ui/components/Library/Team/utils";
import { TeamNotFound } from "ui/components/Library/Team/View/TeamNotFound";
import { useGetWorkspace } from "ui/hooks/workspaces";

import { LibrarySpinner } from "../LibrarySpinner";

export const MY_LIBRARY_TEAM = {
  name: "Your Library",
  isTest: false,
  retentionLimit: null,
  id: "me",
  databaseId: null,
};
type TeamContainerContextType = {
  teamId: string;
  team?: Workspace | typeof MY_LIBRARY_TEAM | null;
};

export const TeamContext = createContext<TeamContainerContextType>(null as any);

export function TeamContextRoot({ children }: { children: ReactNode }) {
  const { teamId } = useGetTeamRouteParams();
  const { workspace, loading: workspaceLoading } = useGetWorkspace(teamId);

  if (workspaceLoading) {
    return <LibrarySpinner />;
  }

  if (workspace == null && !hasApiKey()) {
    // Either the Workspace ID is invalid or the current user does not have access to this Workspace
    return <TeamNotFound />;
  }

  return (
    <TeamContext.Provider value={{ teamId, team: workspace }}>{children}</TeamContext.Provider>
  );
}

export function MyLibraryContextRoot({ children }: { children: ReactNode }) {
  const { teamId } = useGetTeamRouteParams();

  return (
    <TeamContext.Provider value={{ teamId, team: MY_LIBRARY_TEAM }}>
      {children}
    </TeamContext.Provider>
  );
}
