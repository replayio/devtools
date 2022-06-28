import hooks from "ui/hooks";
import styles from "../Library.module.css";
import { Workspace } from "ui/types";
import { ReactNode } from "react";
import { Invitations } from "./Invitations";
import { TeamButton } from "./TeamButton";
import Profile from "./Profile";
import { NewTeamButton } from "./NewTeamButton";

function NavigationContainer({ children }: { children: ReactNode }) {
  return <div className={`flex w-64 flex-shrink-0 flex-col ${styles.sidebar}`}>{children}</div>;
}

export default function Navigation() {
  const { workspaces, loading } = hooks.useGetNonPendingWorkspaces();

  return (
    <NavigationContainer>
      {loading ? null : <NavigationContent workspaces={workspaces} />}
    </NavigationContainer>
  );
}

function NavigationContent({ workspaces }: { workspaces: Workspace[] }) {
  const userLibrary = { id: null, name: "Your Library", members: [] };

  // This corresponds with tailwind colors: thumb is gray-500 and track is gray-800
  const scrollbarStyle = { scrollbarColor: "#6B7280 #1F2937" };

  return (
    <>
      <div className="p-4">
        <img className="w-8 h-8" src="/images/logo.svg" />
      </div>
      <div
        className="flex flex-col flex-grow overflow-auto text-sm library-sidebar"
        style={scrollbarStyle}
      >
        <div className="flex flex-col">
          <TeamButton label={userLibrary.name} id={userLibrary.id} />
          <Invitations />
          {workspaces.map((w, i) => (
            <TeamButton label={w.name} key={i} id={w.id} isTest={w.isTest} />
          ))}
          <NewTeamButton />
        </div>
      </div>
      <Profile />
    </>
  );
}
