import hooks from "ui/hooks";
import styles from "../Library.module.css";
import { Workspace } from "ui/types";
import { Invitations } from "./Invitations";
import { TeamButton } from "./TeamButton";
import Profile from "./Profile";
import { NewTeamButton } from "./NewTeamButton";
import { MY_LIBRARY_TEAM } from "../Team/TeamContextRoot";
import { LibrarySpinner } from "../LibrarySpinner";

function Teams() {
  const { workspaces, loading } = hooks.useGetNonPendingWorkspaces();

  if (loading) {
    return <LibrarySpinner />;
  }

  return (
    <>
      {workspaces.map((w, i) => (
        <TeamButton label={w.name} key={i} id={w.id} isTest={w.isTest} />
      ))}
    </>
  );
}

export default function Navigation() {
  // This corresponds with tailwind colors: thumb is gray-500 and track is gray-800
  const scrollbarStyle = { scrollbarColor: "#6B7280 #1F2937" };

  return (
    <div className={`flex w-64 flex-shrink-0 flex-col ${styles.navigation}`}>
      <div className="p-4">
        <img className="w-8 h-8" src="/images/logo.svg" />
      </div>
      <div
        className="flex flex-col flex-grow overflow-auto text-sm library-sidebar"
        style={scrollbarStyle}
      >
        <div className="flex flex-col">
          <TeamButton label={MY_LIBRARY_TEAM.name} id={MY_LIBRARY_TEAM.id} />
          <Invitations />
          <Teams />
          <NewTeamButton />
        </div>
      </div>
      <Profile />
    </div>
  );
}
