import { createContext, ReactNode } from "react";
import { useGetTeamRouteParams } from "../../../src/utils";
import { ViewPage } from "./View/ViewPage";

type TeamContainerContextType = {
  teamId: string;
};

export const TeamContext = createContext<TeamContainerContextType>(null);

export function TeamContainer({ children }: { children: ReactNode }) {
  const { teamId } = useGetTeamRouteParams();

  return <TeamContext.Provider value={{ teamId }}>{children}</TeamContext.Provider>;
}

export function TeamPage() {
  return (
    <TeamContainer>
      <TeamPageContent />
    </TeamContainer>
  );
}

function TeamPageContent() {
  return <ViewPage />;
}
