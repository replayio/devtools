import hooks from "ui/hooks";

import { LibrarySpinner } from "../LibrarySpinner";
import { MY_LIBRARY_TEAM } from "../Team/TeamContextRoot";
import { NewTeamButton } from "./NewTeamButton";
import Profile from "./Profile";
import { TeamButton } from "./TeamButton";
import styles from "../Library.module.css";

function Teams() {
  const { workspaces, loading } = hooks.useGetNonPendingWorkspaces();

  if (loading) {
    return <LibrarySpinner />;
  }

  return (
    <>
      {workspaces.map(w => (
        <TeamButton label={w.name} key={w.id} id={w.id} isTest={w.isTest} />
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
        <img className="h-8 w-8" src="/images/logo.svg" />
      </div>
      <div
        className="library-sidebar flex flex-grow flex-col overflow-auto text-sm"
        style={scrollbarStyle}
      >
        <div className="flex flex-col">
          <TeamButton label={MY_LIBRARY_TEAM.name} id={MY_LIBRARY_TEAM.id} />
          <Teams />
          <NewTeamButton />
        </div>
      </div>
      <Profile />
    </div>
  );
}
