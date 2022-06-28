import { useRouter } from "next/router";
import { createContext, ReactNode, useContext, useEffect } from "react";
import { setModal } from "ui/actions/app";
import { useGetWorkspace } from "ui/hooks/workspaces";
import { useAppDispatch } from "ui/setup/hooks";
import { Workspace } from "ui/types";
import { useGetTeamRouteParams } from "ui/utils/library";
import { ViewPage } from "./View/ViewPage";

export const MY_LIBRARY_TEAM = { name: "Your Library", isTest: false, id: "me" };

type TeamContainerContextType = {
  teamId: string;
  team?: Workspace | typeof MY_LIBRARY_TEAM;
};

export const TeamContext = createContext<TeamContainerContextType>(null as any);

export function TeamContainer({ children }: { children: ReactNode }) {
  const { teamId } = useGetTeamRouteParams();
  const { workspace } = useGetWorkspace(teamId);

  return (
    <TeamContext.Provider value={{ teamId, team: workspace }}>{children}</TeamContext.Provider>
  );
}

export function MyLibraryContainer({ children }: { children: ReactNode }) {
  const { teamId } = useGetTeamRouteParams();

  return (
    <TeamContext.Provider value={{ teamId, team: MY_LIBRARY_TEAM }}>
      {children}
    </TeamContext.Provider>
  );
}

export function TeamPage() {
  const dispatch = useAppDispatch();
  const { teamId } = useGetTeamRouteParams();
  const router = useRouter();

  useEffect(() => {
    const {
      query: { settings },
    } = router;

    if (settings) {
      dispatch(setModal("workspace-settings", settings ? { view: settings as string } : null));
    }
  }, [dispatch, router]);

  if (teamId === MY_LIBRARY_TEAM.id) {
    return (
      <MyLibraryContainer>
        <TeamPageContent />
      </MyLibraryContainer>
    );
  }

  return (
    <TeamContainer>
      <TeamPageContent />
    </TeamContainer>
  );
}

function TeamPageContent() {
  const { team } = useContext(TeamContext);

  return <ViewPage defaultView={team?.isTest ? "runs" : "recordings"} />;
}
